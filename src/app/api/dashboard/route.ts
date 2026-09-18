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

    const finMesActual = new Date(Date.UTC(
      ahoraArg.getUTCFullYear(),
      ahoraArg.getUTCMonth() + 1,
      1,
      3, 0, 0
    ))

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

    const impuestosPagadosMes = await TaxRecord.aggregate([
      { $match: { pagado: true, vencimiento: { $gte: inicioMes, $lt: finMesActual } } },
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
    const totalImpuestosPagadosMes = impuestosPagadosMes[0]?.total ?? 0
    const totalFijosMes = totalGastosRecurrentesMes + totalImpuestosPagadosMes
    const gananciaMesActual = ventasMes[0]?.ganancia ?? 0
    const margenBrutoPromedio = totalVentasMes > 0 ? gananciaMesActual / totalVentasMes : 0
    const puntoEquilibrio = margenBrutoPromedio > 0 ? totalFijosMes / margenBrutoPromedio : null

    // --- NUEVO: ventas de los últimos 30 días, para el gráfico de línea ---
    const hace30dias = new Date(inicioDia)
    hace30dias.setUTCDate(hace30dias.getUTCDate() - 29) // incluye hoy = 30 días

    const ventasPorDiaRaw = await Sale.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: hace30dias } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '-03:00' } },
          total: { $sum: '$total' },
          ganancia: { $sum: '$ganancia' },
        },
      },
    ])
    const mapaVentasPorDia = new Map(ventasPorDiaRaw.map((v) => [v._id, v]))
    const ventasPorDia = []
    for (let i = 0; i < 30; i++) {
      const dia = new Date(hace30dias)
      dia.setUTCDate(hace30dias.getUTCDate() + i)
      const clave = dia.toISOString().slice(0, 10)
      const encontrado = mapaVentasPorDia.get(clave)
      ventasPorDia.push({
        fecha: clave.slice(8, 10) + '/' + clave.slice(5, 7),
        total: encontrado?.total ?? 0,
        ganancia: encontrado?.ganancia ?? 0,
      })
    }

    // --- NUEVO: productos activos por categoría, para el donut ---
    const productosConCategoria = await Product.find({ activo: true })
      .select('categoria')
      .populate('categoria', 'nombre')
      .lean()

    const conteoPorCategoria: Record<string, number> = {}
    productosConCategoria.forEach((p) => {
      const cat = p.categoria as unknown as { nombre?: string } | null
      const nombre = cat?.nombre ?? 'Sin categoría'
      conteoPorCategoria[nombre] = (conteoPorCategoria[nombre] ?? 0) + 1
    })
    const categoriasOrdenadas = Object.entries(conteoPorCategoria)
      .map(([categoria, cantidad]) => ({ categoria, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)

    const topCategorias = categoriasOrdenadas.slice(0, 5)
    const restoCategorias = categoriasOrdenadas.slice(5)
    const totalResto = restoCategorias.reduce((acc, c) => acc + c.cantidad, 0)
    const productosPorCategoria =
      totalResto > 0 ? [...topCategorias, { categoria: 'Otros', cantidad: totalResto }] : topCategorias

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
        gastosRecurrentesMes: totalFijosMes,
        margenBrutoPromedio,
        puntoEquilibrio,
        stockBajo,
        ultimasVentas,
        impuestosPendientes,
        bajasMesCantidad: bajasMes[0]?.cantidad ?? 0,
        bajasMesTotal: bajasMes[0]?.total ?? 0,
        bajasMesRegistros: bajasMes[0]?.registros ?? 0,
        ultimasBajas,
        ventasPorDia,
        productosPorCategoria,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}