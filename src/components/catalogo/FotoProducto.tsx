'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImagePlus } from 'lucide-react'

export default function FotoProducto({ src, nombre, onCargar }: { src?: string; nombre: string; onCargar?: () => void }) {
  const [fallida, setFallida] = useState<string | null>(null)
  if (!src || fallida === src) return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-500">
      <ImagePlus size={32} aria-hidden />
      <span className="text-sm">{src ? 'No se pudo cargar la foto' : 'Imagen pendiente'}</span>
      {onCargar && <button type="button" onClick={onCargar} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white">Subir imagen</button>}
    </div>
  )
  return <Image src={src} alt={nombre} width={320} height={320} onError={() => setFallida(src)} className="h-64 w-full rounded-xl border border-slate-200 bg-white object-contain p-3" unoptimized />
}
