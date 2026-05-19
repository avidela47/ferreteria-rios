import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Expense from '@/models/Expense'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const pagina = Number(searchParams.get('pagina') ?? 1)
    const limite = Number(searchParams.get('limite') ?? 20)
    const categoria = searchParams.get('categoria')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const recurrente = searchParams.get('recurrente')

    const filtro: Record<string, unknown> = { activo: true }

    if (categoria) filtro.categoria = categoria
    if (recurrente !== null) filtro.recurrente = recurrente === 'true'

    if (desde || hasta) {
      filtro.fecha = {
        ...(desde ? { $gte: new Date(desde) } : {}),
        ...(hasta ? { $lte: new Date(hasta) } : {}),
      }
    }

    const total = await Expense.countDocuments(filtro)
    const gastos = await Expense.find(filtro)
      .sort({ fecha: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)

    return NextResponse.json({
      ok: true,
      data: gastos,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('GET /api/gastos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    await connectDB()

    const body = await req.json()

    if (!body.descripcion || !body.categoria || !body.monto || !body.fecha) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const gasto = await Expense.create(body)

    return NextResponse.json(
      { ok: true, data: gasto, mensaje: 'Gasto registrado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/gastos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}