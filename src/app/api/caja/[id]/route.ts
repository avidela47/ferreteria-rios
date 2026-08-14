import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import CashRegister from '@/models/CashRegister'
import Sale from '@/models/Sale'
import { auth } from '@/lib/auth'

function inicioFinDeFecha(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  const inicio = new Date(Date.UTC(y, m - 1, d, 3, 0, 0))
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000)
  return { inicio, fin }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const caja = await CashRegister.findById(id)
    if (!caja) {
      return NextResponse.json({ ok: false, error: 'Caja no encontrada' }, { status: 404 })
    }
    if (caja.estado === 'cerrada') {
      return NextResponse.json({ ok: false, error: 'Esta caja ya está cerrada' }, { status: 400 })
    }

    const { inicio, fin } = inicioFinDeFecha(caja.fecha)

    const ventasEfectivo = await Sale.aggregate([
      { $match: { estado: 'completada', formaPago: 'efectivo', createdAt: { $gte: inicio, $lt: fin } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])
    const ventasOtros = await Sale.aggregate([
      { $match: { estado: 'completada', formaPago: { $ne: 'efectivo' }, createdAt: { $gte: inicio, $lt: fin } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    const efectivoVentas = ventasEfectivo[0]?.total ?? 0
    const otrosVentas = ventasOtros[0]?.total ?? 0

    const cajaActualizada = await CashRegister.findByIdAndUpdate(
      id,
      {
        estado: 'cerrada',
        efectivoVentas,
        otrosVentas,
        efectivoFinal: caja.montoInicial + efectivoVentas,
        otrosFinal: otrosVentas,
        usuarioCierre: session.user?.nombre ?? '',
        horaCierre: new Date(),
        nota: body.nota ?? '',
      },
      { new: true }
    )

    return NextResponse.json({ ok: true, data: cajaActualizada, mensaje: 'Caja cerrada correctamente' })
  } catch (error) {
    console.error('PUT /api/caja/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}