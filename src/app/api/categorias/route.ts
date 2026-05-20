import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Category from '@/models/Category'


export async function GET() {
  try {
    

    await connectDB()

    const categorias = await Category.find({ activo: true }).sort({ nombre: 1 })

    return NextResponse.json({ ok: true, data: categorias })
  } catch (error) {
    console.error('GET /api/categorias', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    

    await connectDB()

    const body = await req.json()
    const categoria = await Category.create(body)

    return NextResponse.json(
      { ok: true, data: categoria, mensaje: 'Categoría creada correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/categorias', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}