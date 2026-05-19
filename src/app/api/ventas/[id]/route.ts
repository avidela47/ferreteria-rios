import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Product from '@/models/Product'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params

    const venta = await Sale.findById(id).populate('vendedor', 'nombre')

    if (!venta) {
      return NextResponse.json({ ok: false, error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: venta })
  } catch (error) {
    console.error('GET /api/ventas/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const venta = await Sale.findById(id)

    if (!venta) {
      return NextResponse.json({ ok: false, error: 'Venta no encontrada' }, { status: 404 })
    }

    // Si se anula la venta devolvemos el stock
    if (body.estado === 'anulada' && venta.estado !== 'anulada') {
      for (const item of venta.items) {
        await Product.findByIdAndUpdate(item.producto, {
          $inc: { cantidad: item.cantidad },
        })
      }
    }

    const ventaActualizada = await Sale.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )

    return NextResponse.json({
      ok: true,
      data: ventaActualizada,
      mensaje: body.estado === 'anulada'
        ? 'Venta anulada correctamente'
        : 'Venta actualizada correctamente',
    })
  } catch (error) {
    console.error('PUT /api/ventas/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}