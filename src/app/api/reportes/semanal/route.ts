import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Expense from '@/models/Expense'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const ahora = new Date()
    const inicioSemana = desde
      ? new Date(desde)
      : new Date(ahora.setDate(ahora.getDate() - ahora.getDay()))
    inicioSemana.setHours(0, 0, 0, 0)

    const finSemana = hasta
      ? new Date(hasta)
      : new Date(inicioSemana)
    if (!hasta) {
      finSemana.setDate(inicioSemana.getDate() + 6)
      finSemana.setHours(23, 59, 59, 999)
    }

    // Ventas por día
    const ventasPorDia = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioSemana, $lte: finSemana },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: '$total' },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const ventasPorDiaMapeadas = dias.map((dia, i) => {
      const found = ventasPorDia.find((v) => v._id === i + 1)
      return { dia, total: found?.total ?? 0, cantidad: found?.cantidad ?? 0 }
    })

    // Totales ventas
    const totalesVentas = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioSemana, $lte: finSemana },
        },
      },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$total' },
          totalCostos: { $sum: '$costoTotal' },
          ganancia: { $sum: '$ganancia' },
          cantidadVentas: { $sum: 1 },
        },
      },
    ])

    // Top productos
    const topProductos = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioSemana, $lte: finSemana },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nombre',
          cantidad: { $sum: '$items.cantidad' },
          total: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $project: { nombre: '$_id', cantidad: 1, total: 1, _id: 0 } },
    ])

    // Gastos de la semana
    const totalesGastos = await Expense.aggregate([
      {
        $match: {
          activo: true,
          fecha: { $gte: inicioSemana, $lte: finSemana },
        },
      },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ])

    const data = totalesVentas[0] ?? {
      totalVentas: 0,
      totalCostos: 0,
      ganancia: 0,
      cantidadVentas: 0,
    }

    return NextResponse.json({
      ok: true,
      data: {
        semana: `${inicioSemana.toLocaleDateString('es-AR')} — ${finSemana.toLocaleDateString('es-AR')}`,
        totalVentas: data.totalVentas,
        totalCostos: data.totalCostos,
        totalGastos: totalesGastos[0]?.total ?? 0,
        ganancia: data.ganancia,
        cantidadVentas: data.cantidadVentas,
        ventasPorDia: ventasPorDiaMapeadas,
        topProductos,
      },
    })
  } catch (error) {
    console.error('GET /api/reportes/semanal', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}