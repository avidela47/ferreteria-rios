import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import QuoteRequest from '@/models/QuoteRequest'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const presupuestos = await QuoteRequest.find()
      .populate('proveedor', 'nombre telefono email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ ok: true, data: presupuestos })
  } catch (error) {
    console.error('GET /api/presupuestos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const body = await req.json()
    const { proveedor, items, nota } = body

    if (!proveedor) {
      return NextResponse.json({ ok: false, error: 'Debe seleccionar un proveedor' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'El pedido debe tener al menos un producto' }, { status: 400 })
    }

    const ultimo = await QuoteRequest.findOne().sort({ numero: -1 })
    const numero = ultimo ? ultimo.numero + 1 : 1

    const presupuesto = await QuoteRequest.create({
      numero,
      proveedor,
      items,
      nota: nota ?? '',
    })

    return NextResponse.json(
      { ok: true, data: presupuesto, mensaje: 'Pedido de presupuesto creado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/presupuestos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}