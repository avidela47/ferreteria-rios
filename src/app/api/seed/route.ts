import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await connectDB()

    const existe = await User.findOne({ email: 'admin@ferreteriarios.com' })
    if (existe) {
      return NextResponse.json({ ok: false, mensaje: 'El usuario admin ya existe' })
    }

    const password = await bcrypt.hash('admin123', 10)

    const user = await User.create({
      nombre: 'Ariel',
      email: 'admin@ferreteriarios.com',
      password,
      rol: 'admin',
      activo: true,
    })

    return NextResponse.json({
      ok: true,
      mensaje: 'Usuario admin creado correctamente',
      data: { email: user.email, password: 'admin123' },
    })
  } catch (error) {
    console.error('GET /api/seed', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}