import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Purchase from '@/models/Purchase'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const pagina = Number(searchParams.get('pagina') ?? 1)
    const limite = Number(searchParams.get('limite') ?? 20)
    const estado = searchParams.get('estado')
    const proveedor = searchParams.get('proveedor')

    const filtro: Record<string, unknown> = {}
    if (estado) filtro.estado = estado
    if (proveedor) filtro.proveedor = proveedor

    const total = await Purchase.countDocuments(filtro)
    const compras = await Purchase.find(filtro)
      .populate('proveedor', 'nombre telefono email')
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)

    return NextResponse.json({
      ok: true,
      data: compras,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('GET /api/compras', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    await connectDB()

    const body = await req.json()
    const { items, proveedor, nota } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'La orden debe tener al menos un producto' },
        { status: 400 }
      )
    }

    if (!proveedor) {
      return NextResponse.json(
        { ok: false, error: 'Debe seleccionar un proveedor' },
        { status: 400 }
      )
    }

    // Calcular total
    let total = 0
    for (const item of items) {
      item.subtotal = item.precioCosto * item.cantidad
      total += item.subtotal
    }

    // Número autoincremental
    const ultima = await Purchase.findOne().sort({ numero: -1 })
    const numero = ultima ? ultima.numero + 1 : 1

    const compra = await Purchase.create({
      numero,
      proveedor,
      items,
      total,
      estado: 'borrador',
      nota: nota ?? '',
    })

    return NextResponse.json(
      { ok: true, data: compra, mensaje: 'Orden de compra creada correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/compras', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}