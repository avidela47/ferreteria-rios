'use client'

import { useState, useEffect } from 'react'
import { IProduct, ICategory, ISupplier } from '@/types'
import { calcularMargen, calcularPrecioVenta } from '@/lib/utils'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  producto?: IProduct | null
  onGuardado: () => void
  onCerrar: () => void
}

function getProveedorId(proveedor?: IProduct['proveedor']): string {
  if (!proveedor) return ''
  if (typeof proveedor === 'string') return proveedor
  return proveedor._id ?? ''
}

function getCategoriaId(categoria?: IProduct['categoria']): string {
  if (!categoria) return ''
  if (typeof categoria === 'string') return categoria
  return categoria._id ?? ''
}

export default function ProductoForm({ producto, onGuardado, onCerrar }: Props) {
  const [categorias, setCategorias] = useState<ICategory[]>([])
  const [proveedores, setProveedores] = useState<ISupplier[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
  nombre: producto?.nombre ?? '',
  codigo: producto?.codigo ?? '',
  categoria: getCategoriaId(producto?.categoria),
  cantidad: producto?.cantidad ?? 0,
  stockMinimo: producto?.stockMinimo ?? 5,
  unidad: producto?.unidad ?? 'u.',
  precioCosto: producto?.precioCosto ?? 0,
  precioVenta: producto?.precioVenta ?? 0,
  margen: producto?.margen ?? 0,
  proveedor: getProveedorId(producto?.proveedor),
})

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, provRes] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/proveedores'),
      ])
      const [catJson, provJson] = await Promise.all([catRes.json(), provRes.json()])
      if (catJson.ok) setCategorias(catJson.data)
      if (provJson.ok) setProveedores(provJson.data)
    }
    fetchData()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'precioCosto' || name === 'precioVenta') {
        updated.margen = calcularMargen(
          Number(name === 'precioCosto' ? value : prev.precioCosto),
          Number(name === 'precioVenta' ? value : prev.precioVenta)
        )
      }
      if (name === 'margen') {
        updated.precioVenta = calcularPrecioVenta(Number(prev.precioCosto), Number(value))
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = producto ? `/api/productos/${producto._id}` : '/api/productos'
    const method = producto ? 'PUT' : 'POST'

    const body = {
      ...form,
      proveedor: form.proveedor || null,
      cantidad: Number(form.cantidad),
      stockMinimo: Number(form.stockMinimo),
      precioCosto: Number(form.precioCosto),
      precioVenta: Number(form.precioVenta),
      margen: Number(form.margen),
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-slate-800">
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">Código *</label>
    <input
      name="codigo"
      value={form.codigo}
      onChange={handleChange}
      required
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  </div>
  <div className="col-span-2">
    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
    <input
      name="nombre"
      value={form.nombre}
      onChange={handleChange}
      required
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  </div>
</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c._id} value={c._id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <select
                name="proveedor"
                value={form.proveedor}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p._id} value={p._id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input
                name="cantidad"
                type="number"
                value={form.cantidad}
                onChange={handleChange}
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock minimo</label>
              <input
                name="stockMinimo"
                type="number"
                value={form.stockMinimo}
                onChange={handleChange}
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
              <input
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio costo</label>
              <input
                name="precioCosto"
                type="number"
                step="0.01"
                value={form.precioCosto}
                onChange={handleChange}
                min={0}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Margen %</label>
              <input
                name="margen"
                step="0.01"
                type="number"
                value={form.margen}
                onChange={handleChange}
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio venta</label>
              <input
                name="precioVenta"
                step="0.01"
                type="number"
                value={form.precioVenta}
                onChange={handleChange}
                min={0}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}