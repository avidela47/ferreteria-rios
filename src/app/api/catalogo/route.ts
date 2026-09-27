import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Ficha from '@/models/Ficha'
import { esAdmin } from '@/lib/permisos'
import { checkAuth } from '@/lib/api-auth'
import Product from '@/models/Product'
import '@/models/Category'
import { unirCatalogo, type ProductoCatalogo } from '@/lib/catalogo'
import type { IFicha } from '@/types/catalogo'

export async function GET() {
  try {
    const { error } = await checkAuth()
    if (error) return error
    await connectDB()
    const [productos, fichas] = await Promise.all([
      Product.find({ activo: true }).select('codigo nombre categoria precioVenta cantidad unidad').populate('categoria', 'nombre').lean(),
      Ficha.find({ activo: true }).lean(),
    ])
    const data = unirCatalogo(productos as unknown as ProductoCatalogo[], fichas as unknown as IFicha[])
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al leer catálogo' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const body = await req.json()
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
    if (!codigo) return NextResponse.json({ ok: false, error: 'Ingresá el código del producto' }, { status: 400 })
    if (await Ficha.exists({ codigo, activo: true })) {
      return NextResponse.json({ ok: false, error: 'Este producto ya tiene ficha. Buscalo en el catálogo para editarla.' }, { status: 409 })
    }
    const producto = await Product.findOne({ codigo, activo: true }).populate('categoria', 'nombre')
    if (!producto) return NextResponse.json({ ok: false, error: 'Primero cargá este producto en Stock para poder completar su ficha' }, { status: 400 })
    body.codigo = codigo
    body.nombre = producto.nombre
    body.categoria = producto.categoria?.nombre ?? ''
    const ficha = await Ficha.create({ ...body, activo: true })
    return NextResponse.json({ ok: true, data: ficha, mensaje: 'Ficha creada correctamente' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al crear ficha' }, { status: 500 })
  }
}
