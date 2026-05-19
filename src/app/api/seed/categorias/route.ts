import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Category from '@/models/Category'

export async function GET() {
  try {
    await connectDB()

    const categorias = [
      { nombre: 'Electricidad' },
      { nombre: 'Plomeria' },
      { nombre: 'Herramientas' },
      { nombre: 'Pintureria' },
      { nombre: 'Fijaciones y buloneria' },
      { nombre: 'Adhesivos y selladores' },
      { nombre: 'Cerrajeria y herrajes' },
      { nombre: 'Materiales de obra' },
      { nombre: 'Seguridad y EPP' },
    ]

    await Category.insertMany(categorias, { ordered: false })

    return NextResponse.json({ ok: true, mensaje: 'Categorias creadas' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error o ya existen' })
  }
}