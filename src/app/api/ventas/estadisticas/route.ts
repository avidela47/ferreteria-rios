import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'

export async function GET() {
  try {
    await connectDB()

    const hoy = new Date()
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

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