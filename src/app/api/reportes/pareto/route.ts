import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Sale from '@/models/Sale'

export async function GET() {
  try {
    await connectDB()

    const productos = await Sale.aggregate([
      { $match: { estado: 'completada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nombre',
          codigo: { $first: '$items.codigo' },
          cantidad: { $sum: '$items.cantidad' },
          ventaTotal: { $sum: '$items.subtotal' },
          costoTotal: { $sum: { $multiply: ['$items.cantidad', '$items.precioCosto'] } },
        },
      },
      {
        $project: {
          nombre: '$_id',
          codigo: 1,
          cantidad: 1,
          ventaTotal: 1,
          ganancia: { $subtract: ['$ventaTotal', '$costoTotal'] },
          _id: 0,
        },
      },
      { $sort: { ganancia: -1 } },
    ])

    const gananciaTotal = productos.reduce(function (acc, p) { return acc + p.ganancia }, 0)

    let acumulado = 0
    const conAcumulado = productos.map(function (p, i) {
      acumulado += p.ganancia
      const porcentajeAcumulado = gananciaTotal > 0 ? (acumulado / gananciaTotal) * 100 : 0
      return {
        posicion: i + 1,
        nombre: p.nombre,
        codigo: p.codigo || '',
        cantidad: p.cantidad,
        ventaTotal: p.ventaTotal,
        ganancia: p.ganancia,
        porcentajeGanancia: gananciaTotal > 0 ? (p.ganancia / gananciaTotal) * 100 : 0,
        porcentajeAcumulado,
        esEstrella: porcentajeAcumulado <= 80,
      }
    })

    const cantidadEstrella = conAcumulado.filter(function (p) { return p.esEstrella }).length
    const porcentajeProductos = productos.length > 0 ? (cantidadEstrella / productos.length) * 100 : 0

    return NextResponse.json({
      ok: true,
      data: {
        productos: conAcumulado,
        gananciaTotal,
        totalProductos: productos.length,
        cantidadEstrella,
        porcentajeProductos,
      },
    })
  } catch (error) {
    console.error('GET /api/reportes/pareto', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}