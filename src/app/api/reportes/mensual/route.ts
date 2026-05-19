import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Expense from '@/models/Expense'
import TaxRecord from '@/models/TaxRecord'
import Purchase from '@/models/Purchase'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const mes = Number(searchParams.get('mes') ?? new Date().getMonth() + 1)
    const anio = Number(searchParams.get('anio') ?? new Date().getFullYear())

    const inicioMes = new Date(anio, mes - 1, 1)
    const finMes = new Date(anio, mes, 0, 23, 59, 59, 999)

    // Totales ventas
    const totalesVentas = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioMes, $lte: finMes },
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

    // Ventas por semana
    const ventasPorSemana = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioMes, $lte: finMes },
        },
      },
      {
        $group: {
          _id: { $week: '$createdAt' },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          semana: { $concat: ['Semana ', { $toString: '$_id' }] },
          total: 1,
          _id: 0,
        },
      },
    ])

    // Gastos por categoría
    const gastosPorCategoria = await Expense.aggregate([
      {
        $match: {
          activo: true,
          fecha: { $gte: inicioMes, $lte: finMes },
        },
      },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$monto' },
        },
      },
      { $sort: { total: -1 } },
      { $project: { categoria: '$_id', total: 1, _id: 0 } },
    ])

    const totalGastos = gastosPorCategoria.reduce((acc, g) => acc + g.total, 0)

    // Total impuestos del mes
    const totalesImpuestos = await TaxRecord.aggregate([
      {
        $match: {
          vencimiento: { $gte: inicioMes, $lte: finMes },
        },
      },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ])

    // Total compras del mes
    const totalesCompras = await Purchase.aggregate([
      {
        $match: {
          estado: 'recibida',
          createdAt: { $gte: inicioMes, $lte: finMes },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    // Top productos del mes
    const topProductos = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioMes, $lte: finMes },
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
      { $limit: 10 },
      { $project: { nombre: '$_id', cantidad: 1, total: 1, _id: 0 } },
    ])

    const data = totalesVentas[0] ?? {
      totalVentas: 0,
      totalCostos: 0,
      ganancia: 0,
      cantidadVentas: 0,
    }

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]

    return NextResponse.json({
      ok: true,
      data: {
        mes: meses[mes - 1],
        anio,
        totalVentas: data.totalVentas,
        totalCostos: data.totalCostos,
        totalGastos,
        totalImpuestos: totalesImpuestos[0]?.total ?? 0,
        totalCompras: totalesCompras[0]?.total ?? 0,
        ganancia: data.ganancia,
        cantidadVentas: data.cantidadVentas,
        ventasPorSemana,
        gastosPorCategoria,
        topProductos,
      },
    })
  } catch (error) {
    console.error('GET /api/reportes/mensual', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}