'use client'

import { useState } from 'react'
import { IExpense, CategoriaGasto } from '@/types'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  gasto?: IExpense | null
  onGuardado: () => void
  onCerrar: () => void
}

const categorias: CategoriaGasto[] = [
  'alquiler', 'servicios', 'flete', 'impuestos', 'sueldos', 'mantenimiento', 'otros'
]

export default function GastoForm({ gasto, onGuardado, onCerrar }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    descripcion: gasto?.descripcion ?? '',
    categoria: gasto?.categoria ?? 'otros',
    monto: gasto?.monto ?? 0,
    fecha: gasto?.fecha
      ? new Date(gasto.fecha).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    comprobante: gasto?.comprobante ?? '',
    recurrente: gasto?.recurrente ?? false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = gasto ? `/api/gastos/${gasto._id}` : '/api/gastos'
    const method = gasto ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: Number(form.monto) }),
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-blue-500">
            {gasto ? 'Editar gasto' : 'Nuevo gasto'}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-blue-500 mb-1">Descripcion *</label>
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Categoria *</label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Monto *</label>
              <input
                name="monto"
                type="number"
                step="0.01"
                value={form.monto}
                onChange={handleChange}
                min={0}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Fecha *</label>
              <input
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Comprobante</label>
              <input
                name="comprobante"
                value={form.comprobante}
                onChange={handleChange}
                placeholder="N° factura o ticket"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="recurrente"
              id="recurrente"
              checked={form.recurrente}
              onChange={handleChange}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="recurrente" className="text-sm text-slate-700">
              Gasto recurrente (mensual)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}