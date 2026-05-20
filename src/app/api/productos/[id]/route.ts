import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Product from '@/models/Product'
import { calcularMargen } from '@/lib/utils'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params
    const producto = await Product.findById(id)
      .populate('categoria', 'nombre')
      .populate('proveedor', 'nombre')

    if (!producto) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: producto })
  } catch (error) {
    console.error('GET /api/productos/[id]', error)
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

    if (body.precioCosto && body.precioVenta) {
      body.margen = calcularMargen(
        Number(body.precioCosto),
        Number(body.precioVenta)
      )
    }

    const producto = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!producto) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: producto,
      mensaje: 'Producto actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/productos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    

    await connectDB()
    const { id } = await params

    const producto = await Product.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    )

    if (!producto) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Producto eliminado correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/productos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}