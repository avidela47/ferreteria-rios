import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Category from '@/models/Category'


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const categoria = await Category.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!categoria) {
      return NextResponse.json({ ok: false, error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: categoria,
      mensaje: 'Categoría actualizada correctamente',
    })
  } catch (error) {
    console.error('PUT /api/categorias/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    const categoria = await Category.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    )

    if (!categoria) {
      return NextResponse.json({ ok: false, error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Categoría eliminada correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/categorias/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}