'use client'

import { useState } from 'react'
import { IFicha } from '@/types/catalogo'
import { X, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Props {
  ficha?: IFicha | null
  onGuardado: () => void
  onCerrar: () => void
}

const CATEGORIAS = [
  'Electricidad',
  'Plomeria',
  'Herramientas',
  'Pintureria',
  'Fijaciones y buloneria',
  'Adhesivos y selladores',
  'Cerrajeria y herrajes',
  'Materiales de obra',
  'Seguridad y EPP',
  'Lubricantes y Quimica',
]

export default function CatalogoForm({ ficha, onGuardado, onCerrar }: Props) {
  const [loading, setLoading] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [form, setForm] = useState({
    nombre: ficha?.nombre ?? '',
    codigo: ficha?.codigo ?? '',
    imagen: ficha?.imagen ?? '',
    categoria: ficha?.categoria ?? 'Electricidad',
    descripcion: ficha?.descripcion ?? '',
    paraQueSirve: ficha?.paraQueSirve ?? '',
    quienLoPide: ficha?.quienLoPide ?? '',
    comoSeUsa: ficha?.comoSeUsa ?? '',
    datosClave: ficha?.datosClave ?? '',
    formaApariencia: ficha?.formaApariencia ?? '',
    ventaCruzada: ficha?.ventaCruzada ?? [],
  })
  const [nuevaVenta, setNuevaVenta] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files ? e.target.files[0] : null
    if (!archivo) return

    setSubiendoImagen(true)

    const nombreArchivo = (form.codigo || form.nombre || Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '_')

    const formData = new FormData()
    formData.append('imagen', archivo)
    formData.append('nombre', nombreArchivo)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const json = await res.json()

    if (json.ok) {
      setForm(function (prev) { return Object.assign({}, prev, { imagen: json.url }) })
      toast.success('Imagen subida correctamente')
    } else {
      toast.error(json.error || 'Error al subir la imagen')
    }

    setSubiendoImagen(false)
  }

  function agregarVenta() {
    if (!nuevaVenta.trim()) return
    setForm((prev) => ({ ...prev, ventaCruzada: [...prev.ventaCruzada, nuevaVenta.trim()] }))
    setNuevaVenta('')
  }

  function quitarVenta(i: number) {
    setForm((prev) => ({ ...prev, ventaCruzada: prev.ventaCruzada.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = ficha ? `/api/catalogo/${ficha._id}` : '/api/catalogo'
    const method = ficha ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success(json.mensaje)
      onGuardado()
    } else {
      toast.error(json.error ?? 'Error al guardar')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800">
            {ficha ? 'Editar ficha' : 'Nueva ficha de producto'}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto del producto</label>
            <div className="flex items-center gap-3">
              {form.imagen ? (
                <Image src={form.imagen} alt="foto producto" width={80} height={80} className="w-20 h-20 object-cover rounded-lg border border-slate-200" unoptimized />
              ) : (
                <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                  <Upload size={20} />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagen}
                  className="text-xs text-slate-500"
                />
                {subiendoImagen && <p className="text-xs text-orange-500 mt-1">Subiendo imagen...</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
              <input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Para qué sirve</label>
            <textarea
              name="paraQueSirve"
              value={form.paraQueSirve}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quién lo pide</label>
            <textarea
              name="quienLoPide"
              value={form.quienLoPide}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cómo se usa</label>
            <textarea
              name="comoSeUsa"
              value={form.comoSeUsa}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Forma / Apariencia</label>
            <textarea
              name="formaApariencia"
              value={form.formaApariencia}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-600 mb-1">⚡ Datos clave</label>
            <textarea
              name="datosClave"
              value={form.datosClave}
              onChange={handleChange}
              rows={2}
              className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-orange-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-600 mb-1">🔗 Venta cruzada</label>
            <div className="flex gap-2 mb-2">
              <input
                value={nuevaVenta}
                onChange={(e) => setNuevaVenta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarVenta() } }}
                placeholder="Agregar producto relacionado..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="button"
                onClick={agregarVenta}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.ventaCruzada.map((v, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  {v}
                  <button type="button" onClick={() => quitarVenta(i)} className="hover:text-red-500">
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}