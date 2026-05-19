import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import TaxRecord from '@/models/TaxRecord'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const pagina = Number(searchParams.get('pagina') ?? 1)
    const limite = Number(searchParams.get('limite') ?? 20)
    const tipo = searchParams.get('tipo')
    const pagado = searchParams.get('pagado')
    const vencidos = searchParams.get('vencidos') === 'true'

    const filtro: Record<string, unknown> = {}

    if (tipo) filtro.tipo = tipo
    if (pagado !== null && pagado !== '') filtro.pagado = pagado === 'true'
    if (vencidos) {
      filtro.vencimiento = { $lt: new Date() }
      filtro.pagado = false
    }

    const total = await TaxRecord.countDocuments(filtro)
    const impuestos = await TaxRecord.find(filtro)
      .sort({ vencimiento: 1 })
      .skip((pagina - 1) * limite)
      .limit(limite)

    return NextResponse.json({
      ok: true,
      data: impuestos,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('GET /api/impuestos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()

    const body = await req.json()

    if (!body.tipo || !body.periodo || !body.monto || !body.vencimiento) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const impuesto = await TaxRecord.create(body)

    return NextResponse.json(
      { ok: true, data: impuesto, mensaje: 'Impuesto registrado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/impuestos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}