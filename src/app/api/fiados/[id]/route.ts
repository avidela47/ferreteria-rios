import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Fiado from '@/models/Fiado'
import Product from '@/models/Product'
import Sale from '@/models/Sale'
import { auth } from '@/lib/auth'
import { esAdmin } from '@/lib/permisos'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const fiado = await Fiado.findById(id).populate('usuarioCarga', 'nombre')

    if (!fiado) {
      return NextResponse.json({ ok: false, error: 'Fiado no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: fiado })
  } catch (error) {
    console.error('GET /api/fiados/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const fiado = await Fiado.findById(id)
    if (!fiado) {
      return NextResponse.json({ ok: false, error: 'Fiado no encontrado' }, { status: 404 })
    }

    // --- Acción: marcar como pagado. Genera la venta correspondiente, NO vuelve a tocar stock ---
    if (body.estado === 'pagado') {
      if (fiado.estado === 'pagado') {
        return NextResponse.json({ ok: false, error: 'Este fiado ya está pagado' }, { status: 400 })
      }

      const ultimaVenta = await Sale.findOne().sort({ numero: -1 })
      const numeroVenta = ultimaVenta ? ultimaVenta.numero + 1 : 1

      const venta = await Sale.create({
        numero: numeroVenta,
        cliente: fiado.cliente,
        items: fiado.items.map(function (item) {
          return {
            producto: item.producto,
            codigo: item.codigo,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioCosto: item.precioCosto,
            precioVenta: item.precioVenta,
            subtotal: item.subtotal,
          }
        }),
        total: fiado.total,
        costoTotal: fiado.costoTotal,
        ganancia: fiado.total - fiado.costoTotal,
        formaPago: body.formaPago ?? 'efectivo',
        estado: 'completada',
        nota: 'Generada desde Fiado #' + fiado.numero,
        vendedor: '000000000000000000000000',
      })

      fiado.estado = 'pagado'
      fiado.ventaGenerada = venta._id
      fiado.fechaPago = new Date()
      await fiado.save()

      return NextResponse.json({ ok: true, data: fiado, mensaje: 'Fiado marcado como pagado y venta generada' })
    }

    // --- Edición normal de items/cliente/nota (solo mientras sigue pendiente) ---
    if (fiado.estado === 'pagado') {
      return NextResponse.json({ ok: false, error: 'No se puede editar un fiado ya pagado' }, { status: 400 })
    }

    if (body.items) {
      // Devolver el stock de los items viejos
      for (const itemViejo of fiado.items) {
        await Product.findByIdAndUpdate(itemViejo.producto, { $inc: { cantidad: itemViejo.cantidad } })
      }

      // Validar y descontar stock de los items nuevos
      let total = 0
      let costoTotal = 0
      for (const item of body.items) {
        if (!item.producto) {
          return NextResponse.json({ ok: false, error: `${item.nombre || 'Un producto'} no está vinculado al stock` }, { status: 400 })
        }
        const producto = await Product.findById(item.producto)
        if (!producto) {
          return NextResponse.json({ ok: false, error: `Producto ${item.nombre} no encontrado` }, { status: 404 })
        }
        if (producto.cantidad < item.cantidad) {
          return NextResponse.json({ ok: false, error: `Stock insuficiente para ${producto.nombre}` }, { status: 400 })
        }
        item.precioCosto = producto.precioCosto
        item.subtotal = item.precioVenta * item.cantidad
        total += item.subtotal
        costoTotal += item.precioCosto * item.cantidad
      }
      for (const item of body.items) {
        await Product.findByIdAndUpdate(item.producto, { $inc: { cantidad: -item.cantidad } })
      }

      fiado.items = body.items
      fiado.total = total
      fiado.costoTotal = costoTotal
    }

    if (body.cliente) fiado.cliente = body.cliente
    if (body.nota !== undefined) fiado.nota = body.nota

    await fiado.save()

    return NextResponse.json({ ok: true, data: fiado, mensaje: 'Fiado actualizado correctamente' })
  } catch (error) {
    console.error('PUT /api/fiados/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    const fiado = await Fiado.findById(id)
    if (!fiado) {
      return NextResponse.json({ ok: false, error: 'Fiado no encontrado' }, { status: 404 })
    }

    if (fiado.estado === 'pagado') {
      return NextResponse.json(
        { ok: false, error: 'No se puede eliminar un fiado ya pagado (ya generó una venta)' },
        { status: 400 }
      )
    }

    // Devolver stock
    for (const item of fiado.items) {
      await Product.findByIdAndUpdate(item.producto, { $inc: { cantidad: item.cantidad } })
    }

    await Fiado.findByIdAndDelete(id)

    return NextResponse.json({ ok: true, mensaje: 'Fiado eliminado y stock restituido' })
  } catch (error) {
    console.error('DELETE /api/fiados/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}