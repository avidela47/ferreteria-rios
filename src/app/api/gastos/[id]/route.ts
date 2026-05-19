import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Expense from '@/models/Expense'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params
    const gasto = await Expense.findById(id)

    if (!gasto) {
      return NextResponse.json({ ok: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: gasto })
  } catch (error) {
    console.error('GET /api/gastos/[id]', error)
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

    const gasto = await Expense.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!gasto) {
      return NextResponse.json({ ok: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: gasto,
      mensaje: 'Gasto actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/gastos/[id]', error)
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

    const gasto = await Expense.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    )

    if (!gasto) {
      return NextResponse.json({ ok: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Gasto eliminado correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/gastos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}