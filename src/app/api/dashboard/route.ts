import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import Expense from '@/models/Expense'
import TaxRecord from '@/models/TaxRecord'
import StockAdjustment from '@/models/StockAdjustment'
import '@/models/Category'
import '@/models/Supplier'

export async function GET() {
  try {
    await connectDB()

    const ahora = new Date()
    const offsetArgentina = 3 * 60 * 60 * 1000
    const ahoraArg = new Date(ahora.getTime() - offsetArgentina)

    const inicioDia = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth(),
      ahoraArg.getUTCDate(),
      3, 0, 0
    ))

    const inicioSemana = new Date(ahoraArg)
    inicioSemana.setUTCDate(ahoraArg.getUTCDate() - ahoraArg.getUTCDay())
    const inicioSemanaFinal = new Date(Date.UTC(
      inicioSemana.getUTCFullYear(),
      inicioSemana.getUTCMonth(),
      inicioSemana.getUTCDate(),
      3, 0, 0
    ))

    const inicioMes = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth(),
      1,
      3, 0, 0
    ))

    const inicioMesAnterior = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth() - 1,
      1,
      3, 0, 0
    ))
    // el mes anterior termina justo donde arranca el actual (exclusivo)
    const finMesAnterior = inicioMes

    const ventasHoy = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: inicioDia } } },
      { $group: { _id: null, total: { $sum: '$total' }, ganancia: { $sum: '$ganancia' }, cantidad: { $sum: 1 } } },
    ])

    const ventasSemana = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: inicioSemanaFinal } } },
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

    const gastosRecurrentesMes = await Expense.aggregate([
      { $match: { activo: true, recurrente: true, fecha: { $gte: inicioMes } } },
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

    const bajasMes = await StockAdjustment.aggregate([
      { $match: { createdAt: { $gte: inicioMes } } },
      { $group: { _id: null, cantidad: { $sum: '$cantidad' }, total: { $sum: { $multiply: ['$cantidad', '$precioCosto'] } }, registros: { $sum: 1 } } },
    ])

    const ultimasBajas = await StockAdjustment.find()
      .sort({ createdAt: -1 })
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

    const totalGastosRecurrentesMes = gastosRecurrentesMes[0]?.total ?? 0
    const gananciaMesActual = ventasMes[0]?.ganancia ?? 0
    const margenBrutoPromedio = totalVentasMes > 0 ? gananciaMesActual / totalVentasMes : 0
    const puntoEquilibrio = margenBrutoPromedio > 0 ? totalGastosRecurrentesMes / margenBrutoPromedio : null

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
        gastosRecurrentesMes: totalGastosRecurrentesMes,
        margenBrutoPromedio,
        puntoEquilibrio,
        stockBajo,
        ultimasVentas,
        impuestosPendientes,
        bajasMesCantidad: bajasMes[0]?.cantidad ?? 0,
        bajasMesTotal: bajasMes[0]?.total ?? 0,
        bajasMesRegistros: bajasMes[0]?.registros ?? 0,
        ultimasBajas,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}