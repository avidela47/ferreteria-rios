import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import StockAdjustment from '@/models/StockAdjustment'
import Product from '@/models/Product'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const bajas = await StockAdjustment.find().sort({ createdAt: -1 })

    return NextResponse.json({ ok: true, data: bajas })
  } catch (error) {
    console.error('GET /api/bajas-stock', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const body = await req.json()
    const { producto, cantidad, motivo, nota, usuario } = body

    if (!producto || !cantidad || !motivo) {
      return NextResponse.json({ ok: false, error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const prod = await Product.findById(producto)
    if (!prod) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    if (prod.cantidad < cantidad) {
      return NextResponse.json({ ok: false, error: 'Stock insuficiente. Solo hay ' + prod.cantidad + ' unidades.' }, { status: 400 })
    }

    const ultima = await StockAdjustment.findOne().sort({ numero: -1 })
    const numero = ultima ? ultima.numero + 1 : 1

    const baja = await StockAdjustment.create({
      numero,
      producto: prod._id,
      codigo: prod.codigo || '',
      nombre: prod.nombre,
      cantidad,
      precioCosto: prod.precioCosto,
      motivo,
      nota: nota || '',
      usuario: usuario || '',
    })

    await Product.findByIdAndUpdate(prod._id, { $inc: { cantidad: -cantidad } })

    return NextResponse.json(
      { ok: true, data: baja, mensaje: 'Baja registrada correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/bajas-stock', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}