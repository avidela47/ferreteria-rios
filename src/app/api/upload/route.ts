import { NextRequest, NextResponse } from 'next/server'
import { esAdmin } from '@/lib/permisos'

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No tenés permiso para subir imágenes' }, { status: 403 })
    const formData = await req.formData()
    const archivo = formData.get('imagen') as File
    const nombre = formData.get('nombre') as string

    if (!(archivo instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No se recibio archivo' }, { status: 400 })
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'Elegí una imagen JPG, PNG o WebP de hasta 10 MB' }, { status: 400 })
    }

    const uploadUrl = process.env.IMAGENES_UPLOAD_URL as string
    const clave = process.env.IMAGENES_CLAVE as string
    const baseUrl = process.env.IMAGENES_BASE_URL as string
    if (!uploadUrl || !clave || !baseUrl) return NextResponse.json({ ok: false, error: 'Falta configurar el servidor de imágenes' }, { status: 503 })

    const forwardData = new FormData()
    forwardData.append('imagen', archivo)
    forwardData.append('nombre', String(nombre || 'producto').replace(/[^a-zA-Z0-9_-]/g, '_'))

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'x-clave': clave },
      body: forwardData,
      signal: AbortSignal.timeout(30000),
    })

    const json = await res.json()

    if (!res.ok || !json.ok || typeof json.archivo !== 'string') {
      return NextResponse.json({ ok: false, error: 'Error al subir al servidor de imagenes' }, { status: 500 })
    }

    const urlFinal = baseUrl.replace(/\/$/, '') + '/' + encodeURIComponent(json.archivo)

    return NextResponse.json({ ok: true, url: urlFinal })
  } catch (error) {
    console.error('POST /api/upload', error)
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}
