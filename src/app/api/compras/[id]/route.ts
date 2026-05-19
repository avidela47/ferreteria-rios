import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Purchase from '@/models/Purchase'
import Product from '@/models/Product'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params

    const compra = await Purchase.findById(id)
      .populate('proveedor', 'nombre telefono email')

    if (!compra) {
      return NextResponse.json({ ok: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: compra })
  } catch (error) {
    console.error('GET /api/compras/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const compra = await Purchase.findById(id)

    if (!compra) {
      return NextResponse.json({ ok: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    if (compra.estado === 'cancelada' || compra.estado === 'recibida') {
      return NextResponse.json(
        { ok: false, error: 'No se puede modificar una orden cancelada o recibida' },
        { status: 400 }
      )
    }

    // Si pasa a recibida actualizamos stock y precios
    if (body.estado === 'recibida' && compra.estado !== 'recibida') {
      for (const item of compra.items) {
        await Product.findByIdAndUpdate(item.producto, {
          $inc: { cantidad: item.cantidad },
          $set: { precioCosto: item.precioCosto },
        })
      }
    }

    const compraActualizada = await Purchase.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).populate('proveedor', 'nombre telefono email')

    return NextResponse.json({
      ok: true,
      data: compraActualizada,
      mensaje: body.estado === 'recibida'
        ? 'Orden recibida — stock actualizado correctamente'
        : 'Orden actualizada correctamente',
    })
  } catch (error) {
    console.error('PUT /api/compras/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    const compra = await Purchase.findById(id)

    if (!compra) {
      return NextResponse.json({ ok: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    if (compra.estado === 'recibida') {
      return NextResponse.json(
        { ok: false, error: 'No se puede cancelar una orden ya recibida' },
        { status: 400 }
      )
    }

    await Purchase.findByIdAndUpdate(id, { estado: 'cancelada' })

    return NextResponse.json({
      ok: true,
      mensaje: 'Orden cancelada correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/compras/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}