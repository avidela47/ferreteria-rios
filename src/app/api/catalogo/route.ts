import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Ficha from '@/models/Ficha'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  try {
    await connectDB()
    const fichas = await Ficha.find({ activo: true }).sort({ nombre: 1 })
    return NextResponse.json({ ok: true, data: fichas })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al leer catálogo' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const body = await req.json()
    const ficha = await Ficha.create({ ...body, activo: true })
    return NextResponse.json({ ok: true, data: ficha, mensaje: 'Ficha creada correctamente' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al crear ficha' }, { status: 500 })
  }
}