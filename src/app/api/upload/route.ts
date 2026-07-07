import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const archivo = formData.get('imagen') as File
    const nombre = formData.get('nombre') as string

    if (!archivo) {
      return NextResponse.json({ ok: false, error: 'No se recibio archivo' }, { status: 400 })
    }

    const uploadUrl = process.env.IMAGENES_UPLOAD_URL as string
    const clave = process.env.IMAGENES_CLAVE as string
    const baseUrl = process.env.IMAGENES_BASE_URL as string

    const forwardData = new FormData()
    forwardData.append('imagen', archivo)
    forwardData.append('nombre', nombre)

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'x-clave': clave },
      body: forwardData,
    })

    const json = await res.json()

    if (!json.ok) {
      return NextResponse.json({ ok: false, error: 'Error al subir al servidor de imagenes' }, { status: 500 })
    }

    const urlFinal = baseUrl + '/' + json.archivo

    return NextResponse.json({ ok: true, url: urlFinal })
  } catch (error) {
    console.error('POST /api/upload', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}