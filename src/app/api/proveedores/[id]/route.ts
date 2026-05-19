import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Supplier from '@/models/Supplier'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params
    const proveedor = await Supplier.findById(id)

    if (!proveedor) {
      return NextResponse.json({ ok: false, error: 'Proveedor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: proveedor })
  } catch (error) {
    console.error('GET /api/proveedores/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

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

    const proveedor = await Supplier.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!proveedor) {
      return NextResponse.json({ ok: false, error: 'Proveedor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: proveedor,
      mensaje: 'Proveedor actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/proveedores/[id]', error)
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

    const proveedor = await Supplier.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    )

    if (!proveedor) {
      return NextResponse.json({ ok: false, error: 'Proveedor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Proveedor eliminado correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/proveedores/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}