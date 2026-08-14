import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import CashRegister from '@/models/CashRegister'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const cajas = await CashRegister.find().sort({ createdAt: -1 }).limit(60)

    return NextResponse.json({ ok: true, data: cajas })
  } catch (error) {
    console.error('GET /api/caja/historial', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}