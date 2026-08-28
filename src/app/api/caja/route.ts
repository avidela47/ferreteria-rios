import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import CashRegister from '@/models/CashRegister'
import Sale from '@/models/Sale'
import { auth } from '@/lib/auth'

function fechaHoyArgentina() {
  const ahora = new Date()
  const offsetArgentina = 3 * 60 * 60 * 1000
  const ahoraArg = new Date(ahora.getTime() - offsetArgentina)
  const y = ahoraArg.getUTCFullYear()
  const m = String(ahoraArg.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ahoraArg.getUTCDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const fechaHoy = fechaHoyArgentina()
    const caja = await CashRegister.findOne({ fecha: fechaHoy, estado: 'abierta' })

    if (!caja) {
      return NextResponse.json({ ok: true, data: null })
    }

    const ventasEfectivo = await Sale.aggregate([
      { $match: { estado: 'completada', formaPago: 'efectivo', createdAt: { $gte: caja.horaApertura } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    const ventasOtros = await Sale.aggregate([
      { $match: { estado: 'completada', formaPago: { $ne: 'efectivo' }, createdAt: { $gte: caja.horaApertura } } },
      { $group: { _id: '$formaPago', total: { $sum: '$total' } } },
    ])

    const efectivoVentas = ventasEfectivo[0]?.total ?? 0
    const otrosVentas = ventasOtros.reduce(function (acc, v) { return acc + v.total }, 0)
    const otrosDetalle: Record<string, number> = {}
    ventasOtros.forEach(function (v) { otrosDetalle[v._id] = v.total })

    return NextResponse.json({
      ok: true,
      data: {
        _id: caja._id,
        fecha: caja.fecha,
        montoInicial: caja.montoInicial,
        usuarioApertura: caja.usuarioApertura,
        horaApertura: caja.horaApertura,
        estado: caja.estado,
        efectivoEsperado: caja.montoInicial + efectivoVentas,
        efectivoVentas,
        otrosVentas,
        otrosDetalle,
      },
    })
  } catch (error) {
    console.error('GET /api/caja', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()
    const { montoInicial } = body

    const fechaHoy = fechaHoyArgentina()

    // Antes bloqueaba si existía CUALQUIER caja abierta sin importar la fecha.
    // Eso hacía que una caja vieja mal cerrada frenara la apertura para siempre.
    // Ahora solo bloquea si la caja abierta es la de HOY (mismo criterio que el GET).
    const existente = await CashRegister.findOne({ fecha: fechaHoy, estado: 'abierta' })
    if (existente) {
      return NextResponse.json({ ok: false, error: 'Ya hay una caja abierta hoy. Cerrala antes de abrir otra.' }, { status: 400 })
    }

    const caja = await CashRegister.create({
      fecha: fechaHoy,
      montoInicial: montoInicial ?? 0,
      usuarioApertura: session.user?.nombre ?? '',
      horaApertura: new Date(),
      estado: 'abierta',
    })

    return NextResponse.json({ ok: true, data: caja, mensaje: 'Caja abierta correctamente' }, { status: 201 })
  } catch (error) {
    console.error('POST /api/caja', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}