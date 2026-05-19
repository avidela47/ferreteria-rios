import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await connectDB()

    const existe = await User.findOne({ email: 'vendedor@ferreteriaros.com' })
    if (existe) {
      return NextResponse.json({ ok: false, mensaje: 'El usuario ya existe' })
    }

    const password = await bcrypt.hash('ferreteria2026', 10)

    await User.create({
      nombre: 'Vendedor',
      email: 'vendedor@ferreteriaros.com',
      password,
      rol: 'vendedor',
      activo: true,
    })

    return NextResponse.json({ ok: true, mensaje: 'Usuario vendedor creado' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}