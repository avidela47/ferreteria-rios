import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import QuoteRequest from '@/models/QuoteRequest'
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

    const presupuesto = await QuoteRequest.findById(id)
      .populate('proveedor', 'nombre telefono email direccion')

    if (!presupuesto) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: presupuesto })
  } catch (error) {
    console.error('GET /api/presupuestos/[id]', error)
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

    const presupuesto = await QuoteRequest.findByIdAndUpdate(
      id,
      { $set: { items: body.items, nota: body.nota } },
      { new: true }
    ).populate('proveedor', 'nombre telefono email direccion')

    if (!presupuesto) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: presupuesto,
      mensaje: 'Pedido actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/presupuestos/[id]', error)
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

    await QuoteRequest.findByIdAndDelete(id)

    return NextResponse.json({ ok: true, mensaje: 'Pedido eliminado correctamente' })
  } catch (error) {
    console.error('DELETE /api/presupuestos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}