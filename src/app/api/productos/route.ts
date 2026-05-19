import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Product from '@/models/Product'
import { calcularMargen } from '@/lib/utils'


export async function GET(req: NextRequest) {
  try {
    

    await connectDB()

    const { searchParams } = new URL(req.url)
    const pagina = Number(searchParams.get('pagina') ?? 1)
    const limite = Number(searchParams.get('limite') ?? 20)
    const buscar = searchParams.get('buscar') ?? ''
    const categoria = searchParams.get('categoria') ?? ''
    const stockBajo = searchParams.get('stockBajo') === 'true'

    const filtro: Record<string, unknown> = { activo: true }

    if (buscar) {
      filtro.nombre = { $regex: buscar, $options: 'i' }
    }
    if (categoria) {
      filtro.categoria = categoria
    }
    if (stockBajo) {
      filtro.$expr = { $lte: ['$cantidad', '$stockMinimo'] }
    }

    const total = await Product.countDocuments(filtro)
    const productos = await Product.find(filtro)
      .populate('categoria', 'nombre')
      .populate('proveedor', 'nombre')
      .sort({ nombre: 1 })
      .skip((pagina - 1) * limite)
      .limit(limite)

    return NextResponse.json({
      ok: true,
      data: productos,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('GET /api/productos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()

    const margen = calcularMargen(
      Number(body.precioCosto),
      Number(body.precioVenta)
    )

    const productoData = {
      ...body,
      margen,
      proveedor: body.proveedor || null,
    }

    const producto = await Product.create(productoData)

    return NextResponse.json(
      { ok: true, data: producto, mensaje: 'Producto creado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/productos', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}