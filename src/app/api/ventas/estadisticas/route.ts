import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'

export async function GET() {
  try {
    await connectDB()

    const ahora = new Date()
    const offsetArgentina = 3 * 60 * 60 * 1000
    const ahoraArg = new Date(ahora.getTime() - offsetArgentina)

    const inicioHoy = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth(),
      ahoraArg.getUTCDate(),
      3, 0, 0
    ))

    const inicioMes = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth(),
      1,
      3, 0, 0
    ))

    const filtroActivas = { estado: 'completada' }

    const [totales, totalesHoy, totalesMes] = await Promise.all([
      Sale.aggregate([
        { $match: filtroActivas },
        {
          $group: {
            _id: null,
            cantidad: { $sum: 1 },
            total: { $sum: '$total' },
            costoTotal: { $sum: '$costoTotal' },
            ganancia: { $sum: '$ganancia' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: Object.assign({}, filtroActivas, { createdAt: { $gte: inicioHoy } }) },
        {
          $group: {
            _id: null,
            cantidad: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: Object.assign({}, filtroActivas, { createdAt: { $gte: inicioMes } }) },
        {
          $group: {
            _id: null,
            cantidad: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),
    ])

    const t = totales[0] || { cantidad: 0, total: 0, costoTotal: 0, ganancia: 0 }
    const h = totalesHoy[0] || { cantidad: 0, total: 0 }
    const m = totalesMes[0] || { cantidad: 0, total: 0 }

    return NextResponse.json({
      ok: true,
      data: {
        cantidad: t.cantidad,
        total: t.total,
        costoTotal: t.costoTotal,
        ganancia: t.ganancia,
        hoy: { cantidad: h.cantidad, total: h.total },
        mes: { cantidad: m.cantidad, total: m.total },
      },
    })
  } catch (error) {
    console.error('GET /api/ventas/estadisticas', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}