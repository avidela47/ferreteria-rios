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

export async function GET() {
  try {
    const fichas = await leerFichas()
    return NextResponse.json({ ok: true, data: fichas })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al leer catálogo' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fichas = await leerFichas()

    const nueva: IFicha = {
      id: Date.now().toString(),
      nombre: body.nombre,
      categoria: body.categoria,
      descripcion: body.descripcion ?? '',
      paraQueSirve: body.paraQueSirve ?? '',
      quienLoPide: body.quienLoPide ?? '',
      comoSeUsa: body.comoSeUsa ?? '',
      ventaCruzada: body.ventaCruzada ?? [],
      datosClave: body.datosClave ?? '',
      formaApariencia: body.formaApariencia ?? '',
    }

    fichas.push(nueva)
    await guardarFichas(fichas)

    return NextResponse.json({ ok: true, data: nueva, mensaje: 'Ficha creada correctamente' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error al crear ficha' }, { status: 500 })
  }
}