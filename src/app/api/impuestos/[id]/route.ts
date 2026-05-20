import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import TaxRecord from '@/models/TaxRecord'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    await connectDB()
    const { id } = await params
    const impuesto = await TaxRecord.findById(id)

    if (!impuesto) {
      return NextResponse.json({ ok: false, error: 'Registro no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: impuesto })
  } catch (error) {
    console.error('GET /api/impuestos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const impuesto = await TaxRecord.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!impuesto) {
      return NextResponse.json({ ok: false, error: 'Registro no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: impuesto,
      mensaje: body.pagado
        ? 'Impuesto marcado como pagado'
        : 'Impuesto actualizado correctamente',
    })
  } catch (error) {
    console.error('PUT /api/impuestos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    

    

    await connectDB()
    const { id } = await params

    const impuesto = await TaxRecord.findByIdAndDelete(id)

    if (!impuesto) {
      return NextResponse.json({ ok: false, error: 'Registro no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Registro eliminado correctamente',
    })
  } catch (error) {
    console.error('DELETE /api/impuestos/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}