import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { IFicha } from '@/types/catalogo'

const DATA_PATH = path.join(process.cwd(), 'src/data/catalogo.json')

async function leerFichas(): Promise<IFicha[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function guardarFichas(fichas: IFicha[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(fichas, null, 2), 'utf-8')
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const fichas = await leerFichas()
    const idx = fichas.findIndex((f) => f.id === id)
    if (idx === -1) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 })
    fichas[idx] = { ...fichas[idx], ...body }
    await guardarFichas(fichas)
    return NextResponse.json({ ok: true, data: fichas[idx], mensaje: 'Ficha actualizada' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const fichas = await leerFichas()
    const nuevas = fichas.filter((f) => f.id !== id)
    await guardarFichas(nuevas)
    return NextResponse.json({ ok: true, mensaje: 'Ficha eliminada' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al eliminar' }, { status: 500 })
  }
}