import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Ficha from '@/models/Ficha'
import { esAdmin } from '@/lib/permisos'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()
    const ficha = await Ficha.findByIdAndUpdate(id, body, { new: true })
    if (!ficha) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, data: ficha, mensaje: 'Ficha actualizada' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    await Ficha.findByIdAndDelete(id)
    return NextResponse.json({ ok: true, mensaje: 'Ficha eliminada' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al eliminar' }, { status: 500 })
  }
}