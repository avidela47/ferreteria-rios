import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Expense from '@/models/Expense'

function lunesDeLaSemana(fecha: Date) {
  const d = new Date(fecha)
  const dia = d.getUTCDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setUTCDate(d.getUTCDate() + diff)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3, 0, 0))
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const semanaParam = searchParams.get('semanaInicio')

    const ahora = new Date()
    const offsetArgentina = 3 * 60 * 60 * 1000
    const ahoraArg = new Date(ahora.getTime() - offsetArgentina)

    const inicioSemana = semanaParam
      ? lunesDeLaSemana(new Date(semanaParam + 'T12:00:00Z'))
      : lunesDeLaSemana(ahoraArg)

    const finSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000)

    const filtroVentas = {
      estado: 'completada',
      createdAt: { $gte: inicioSemana, $lt: finSemana },
    }

    const totales = await Sale.aggregate([
      { $match: filtroVentas },
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

    const ventasPorDia = await Sale.aggregate([
      { $match: filtroVentas },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const nombresDias = ['', 'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
    const diasSemana = [2, 3, 4, 5, 6, 7, 1].map(function (numDia) {
      const encontrado = ventasPorDia.find(function (v) { return v._id === numDia })
      return { dia: nombresDias[numDia], total: encontrado ? encontrado.total : 0 }
    })

    const topProductos = await Sale.aggregate([
      { $match: filtroVentas },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nombre',
          cantidad: { $sum: '$items.cantidad' },
          total: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $project: { nombre: '$_id', cantidad: 1, total: 1, _id: 0 } },
    ])

    const totalGastosAgg = await Expense.aggregate([
      { $match: { activo: true, fecha: { $gte: inicioSemana, $lt: finSemana } } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ])

    const data = totales[0] ?? { totalVentas: 0, totalCostos: 0, ganancia: 0, cantidadVentas: 0 }
    const totalGastos = totalGastosAgg[0]?.total ?? 0

    return NextResponse.json({
      ok: true,
      data: {
        inicioSemana: inicioSemana.toISOString(),
        finSemana: new Date(finSemana.getTime() - 1).toISOString(),
        totalVentas: data.totalVentas,
        totalCostos: data.totalCostos,
        ganancia: data.ganancia,
        totalGastos,
        cantidadVentas: data.cantidadVentas,
        diasSemana,
        topProductos,
      },
    })
  } catch (error) {
    console.error('GET /api/reportes/semanal', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}