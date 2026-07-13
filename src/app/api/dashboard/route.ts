import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import Expense from '@/models/Expense'
import TaxRecord from '@/models/TaxRecord'
import '@/models/Category'
import '@/models/Supplier'

export async function GET() {
  try {
    await connectDB()

    const ahora = new Date()
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 3, 0, 0)
    inicioDia.setTime(inicioDia.getTime() - 3 * 60 * 60 * 1000)
    const inicioSemana = new Date(ahora)
    inicioSemana.setDate(ahora.getDate() - ahora.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    // el mes anterior termina justo donde arranca el actual (exclusivo)
    const finMesAnterior = inicioMes

    const ventasHoy = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: inicioDia } } },
      { $group: { _id: null, total: { $sum: '$total' }, ganancia: { $sum: '$ganancia' }, cantidad: { $sum: 1 } } },
    ])

    const ventasSemana = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: inicioSemana } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    const ventasMes = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: '$total' }, ganancia: { $sum: '$ganancia' } } },
    ])

    const ventasMesAnterior = await Sale.aggregate([
      {
        $match: {
          estado: 'completada',
          createdAt: { $gte: inicioMesAnterior, $lt: finMesAnterior },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' }, ganancia: { $sum: '$ganancia' } } },
    ])

    const gastosMes = await Expense.aggregate([
      { $match: { activo: true, fecha: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ])

    const gastosMesAnterior = await Expense.aggregate([
      {
        $match: {
          activo: true,
          fecha: { $gte: inicioMesAnterior, $lt: finMesAnterior },
        },
      },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ])

    const stockBajo = await Product.find({
      activo: true,
      $expr: { $lte: ['$cantidad', '$stockMinimo'] },
    })
      .populate('categoria', 'nombre')
      .limit(10)

    const ultimasVentas = await Sale.find({ estado: 'completada' })
      .populate('vendedor', 'nombre')
      .sort({ createdAt: -1 })
      .limit(5)

    const impuestosPendientes = await TaxRecord.find({
      pagado: false,
      vencimiento: { $gte: ahora },
    })
      .sort({ vencimiento: 1 })
      .limit(5)

    // --- Tendencias (null si no hay dato del mes anterior para comparar) ---
    const totalVentasMes = ventasMes[0]?.total ?? 0
    const totalVentasMesAnterior = ventasMesAnterior[0]?.total ?? 0
    const tendenciaVentasMes =
      totalVentasMesAnterior > 0
        ? Math.round(((totalVentasMes - totalVentasMesAnterior) / totalVentasMesAnterior) * 1000) / 10
        : null

    const totalGastosMes = gastosMes[0]?.total ?? 0
    const totalGastosMesAnterior = gastosMesAnterior[0]?.total ?? 0
    const tendenciaGastosMes =
      totalGastosMesAnterior > 0
        ? Math.round(((totalGastosMes - totalGastosMesAnterior) / totalGastosMesAnterior) * 1000) / 10
        : null

    return NextResponse.json({
      ok: true,
      data: {
        ventasHoy: ventasHoy[0]?.total ?? 0,
        gananciaHoy: ventasHoy[0]?.ganancia ?? 0,
        cantidadVentasHoy: ventasHoy[0]?.cantidad ?? 0,
        ventasSemana: ventasSemana[0]?.total ?? 0,
        ventasMes: totalVentasMes,
        gananciaMes: ventasMes[0]?.ganancia ?? 0,
        tendenciaVentasMes,
        gastosMes: totalGastosMes,
        tendenciaGastosMes,
        stockBajo,
        ultimasVentas,
        impuestosPendientes,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}
