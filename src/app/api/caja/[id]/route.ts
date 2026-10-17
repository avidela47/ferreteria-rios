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

function redondear(n: number) {
  return Math.round(n * 100) / 100
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

    // Arqueo (opcional): efectivo contado y retiro. Se valida antes de escribir nada.
    const arqueo: Record<string, number> = {}
    const hayArqueo = body.efectivoContado !== undefined && body.efectivoContado !== null

    if (hayArqueo) {
      const contado = Number(body.efectivoContado)
      const retiro = Number(body.retiro ?? 0)

      if (!Number.isFinite(contado) || contado < 0) {
        return NextResponse.json({ ok: false, error: 'El efectivo contado no es válido' }, { status: 400 })
      }
      if (!Number.isFinite(retiro) || retiro < 0) {
        return NextResponse.json({ ok: false, error: 'El retiro no es válido' }, { status: 400 })
      }
      if (retiro > contado) {
        return NextResponse.json({ ok: false, error: 'El retiro no puede ser mayor al efectivo contado' }, { status: 400 })
      }

      // Mismo criterio que la tarjeta del dashboard: ventas en efectivo desde la apertura
      const ventasDesdeApertura = await Sale.aggregate([
        { $match: { estado: 'completada', formaPago: 'efectivo', createdAt: { $gte: caja.horaApertura } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ])
      const esperado = caja.montoInicial + (ventasDesdeApertura[0]?.total ?? 0)

      arqueo.efectivoEsperado = redondear(esperado)
      arqueo.efectivoContado = redondear(contado)
      arqueo.retiro = redondear(retiro)
      arqueo.diferencia = redondear(contado - esperado)
      arqueo.efectivoQueda = redondear(contado - retiro)
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
        ...arqueo,
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