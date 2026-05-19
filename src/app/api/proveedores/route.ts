import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Supplier from '@/models/Supplier'


export async function GET() {
  try {
    

    await connectDB()

    const proveedores = await Supplier.find({ activo: true }).sort({ nombre: 1 })

    return NextResponse.json({ ok: true, data: proveedores })
  } catch (error) {
    console.error('GET /api/proveedores', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    

    if (session.user.rol !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 })
    }

    await connectDB()

    const body = await req.json()
    const proveedor = await Supplier.create(body)

    return NextResponse.json(
      { ok: true, data: proveedor, mensaje: 'Proveedor creado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/proveedores', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}