import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import OrderRequest from '@/models/OrderRequest'
import { esAdmin } from '@/lib/permisos'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    const pedido = await OrderRequest.findById(id)

    if (!pedido) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: pedido })
  } catch (error) {
    console.error('GET /api/pedidos/[id]', error)
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

    const pedido = await OrderRequest.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )

    if (!pedido) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: pedido,
      mensaje: 'Pedido actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/pedidos/[id]', error)
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

    await OrderRequest.findByIdAndDelete(id)

    return NextResponse.json({ ok: true, mensaje: 'Pedido eliminado correctamente' })
  } catch (error) {
    console.error('DELETE /api/pedidos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}