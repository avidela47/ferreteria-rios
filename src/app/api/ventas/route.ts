import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Product from '@/models/Product'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const pagina = Number(searchParams.get('pagina') ?? 1)
    const limite = Number(searchParams.get('limite') ?? 20)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const estado = searchParams.get('estado')

    const filtro: Record<string, unknown> = {}

    if (estado) filtro.estado = estado

    if (desde || hasta) {
      filtro.createdAt = {
        ...(desde ? { $gte: new Date(desde) } : {}),
        ...(hasta ? { $lte: new Date(hasta) } : {}),
      }
    }

    const total = await Sale.countDocuments(filtro)
    const ventas = await Sale.find(filtro)
      .populate('vendedor', 'nombre')
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)

    return NextResponse.json({
      ok: true,
      data: ventas,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('GET /api/ventas', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    await connectDB()

    const body = await req.json()
    const { items, formaPago, cliente, nota } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'La venta debe tener al menos un producto' }, { status: 400 })
    }

    // Calcular totales y verificar stock
    let total = 0
    let costoTotal = 0

    for (const item of items) {
      const producto = await Product.findById(item.producto)
      if (!producto) {
        return NextResponse.json({ ok: false, error: `Producto ${item.nombre} no encontrado` }, { status: 404 })
      }
      if (producto.cantidad < item.cantidad) {
        return NextResponse.json({ ok: false, error: `Stock insuficiente para ${producto.nombre}` }, { status: 400 })
      }
      item.subtotal = item.precioVenta * item.cantidad
      item.precioCosto = producto.precioCosto
      total += item.subtotal
      costoTotal += producto.precioCosto * item.cantidad
    }

    const ganancia = total - costoTotal

    // Obtener último número de venta
    const ultima = await Sale.findOne().sort({ numero: -1 })
    const numero = ultima ? ultima.numero + 1 : 1

    const venta = await Sale.create({
      numero,
      cliente: cliente ?? 'Consumidor Final',
      items,
      total,
      costoTotal,
      ganancia,
      formaPago: formaPago ?? 'efectivo',
      nota: nota ?? '',
      vendedor: '000000000000000000000000',
    })

    // Descontar stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.producto, {
        $inc: { cantidad: -item.cantidad },
      })
    }

    return NextResponse.json(
      { ok: true, data: venta, mensaje: 'Venta registrada correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/ventas', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}