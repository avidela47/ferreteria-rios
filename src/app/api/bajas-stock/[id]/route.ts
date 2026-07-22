import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import StockAdjustment from '@/models/StockAdjustment'
import Product from '@/models/Product'
import { esAdmin } from '@/lib/permisos'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ ok: false, error: 'No tenés permiso para esta acción' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    const baja = await StockAdjustment.findById(id)
    if (!baja) {
      return NextResponse.json({ ok: false, error: 'Baja no encontrada' }, { status: 404 })
    }

    await Product.findByIdAndUpdate(baja.producto, { $inc: { cantidad: baja.cantidad } })
    await StockAdjustment.findByIdAndDelete(id)

    return NextResponse.json({ ok: true, mensaje: 'Baja eliminada — stock restaurado' })
  } catch (error) {
    console.error('DELETE /api/bajas-stock/[id]', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}