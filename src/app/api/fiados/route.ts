import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Fiado from '@/models/Fiado'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const fiados = await Fiado.find()
      .populate('usuarioCarga', 'nombre')
      .sort({ createdAt: -1 })

    return NextResponse.json({ ok: true, data: fiados })
  } catch (error) {
    console.error('GET /api/fiados', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()
    const { cliente, items, nota } = body

    if (!cliente || !cliente.trim()) {
      return NextResponse.json({ ok: false, error: 'Falta el nombre del cliente' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'El fiado debe tener al menos un producto' }, { status: 400 })
    }

    // Validar stock y calcular totales. Solo se valida/descuenta stock de items que vienen del inventario real (tienen "producto").
    let total = 0
    let costoTotal = 0

    for (const item of items) {
      if (item.producto) {
        const producto = await Product.findById(item.producto)
        if (!producto) {
          return NextResponse.json({ ok: false, error: `Producto ${item.nombre} no encontrado` }, { status: 404 })
        }
        if (producto.cantidad < item.cantidad) {
          return NextResponse.json({ ok: false, error: `Stock insuficiente para ${producto.nombre}` }, { status: 400 })
        }
        item.precioCosto = producto.precioCosto
      }
      item.subtotal = item.precioVenta * item.cantidad
      total += item.subtotal
      costoTotal += (item.precioCosto || 0) * item.cantidad
    }

    const ultimo = await Fiado.findOne().sort({ numero: -1 })
    const numero = ultimo ? ultimo.numero + 1 : 1

    const fiado = await Fiado.create({
      numero,
      cliente: cliente.trim(),
      items,
      total,
      costoTotal,
      nota: nota ?? '',
      usuarioCarga: session.user.id,
      estado: 'pendiente',
    })

    // Descontar stock solo de los items que vienen del inventario real
    for (const item of items) {
      if (item.producto) {
        await Product.findByIdAndUpdate(item.producto, { $inc: { cantidad: -item.cantidad } })
      }
    }

    return NextResponse.json(
      { ok: true, data: fiado, mensaje: 'Fiado registrado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/fiados', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}