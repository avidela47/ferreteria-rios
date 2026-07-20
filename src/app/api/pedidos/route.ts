import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import OrderRequest from '@/models/OrderRequest'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const pedidos = await OrderRequest.find().sort({ createdAt: -1 })

    return NextResponse.json({ ok: true, data: pedidos })
  } catch (error) {
    console.error('GET /api/pedidos', error)
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
    const { items, nota } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'El pedido debe tener al menos un producto' }, { status: 400 })
    }

    const ultimo = await OrderRequest.findOne().sort({ numero: -1 })
    const numero = ultimo ? ultimo.numero + 1 : 1

    const pedido = await OrderRequest.create({
      numero,
      items,
      nota: nota ?? '',
      estado: 'borrador',
    })

    return NextResponse.json(
      { ok: true, data: pedido, mensaje: 'Pedido creado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/pedidos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}