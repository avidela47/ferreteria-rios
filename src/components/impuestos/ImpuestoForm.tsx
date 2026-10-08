'use client'

import { useState } from 'react'
import { ITaxRecord, TipoImpuesto } from '@/types'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  impuesto?: ITaxRecord | null
  onGuardado: () => void
  onCerrar: () => void
}

const tipos: TipoImpuesto[] = ['IVA', 'IIBB', 'monotributo', 'municipal', 'otro']

export default function ImpuestoForm({ impuesto, onGuardado, onCerrar }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: impuesto?.tipo ?? 'monotributo',
    periodo: impuesto?.periodo ?? '',
    monto: impuesto?.monto ?? 0,
    vencimiento: impuesto?.vencimiento
      ? new Date(impuesto.vencimiento).toISOString().split('T')[0]
      : '',
    comprobante: impuesto?.comprobante ?? '',
    nota: impuesto?.nota ?? '',
    pagado: impuesto?.pagado ?? false,
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

    const url = impuesto ? `/api/impuestos/${impuesto._id}` : '/api/impuestos'
    const method = impuesto ? 'PUT' : 'POST'

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
            {impuesto ? 'Editar impuesto' : 'Nuevo impuesto'}
          </h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Tipo *</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Periodo *</label>
              <input
                name="periodo"
                value={form.periodo}
                onChange={handleChange}
                placeholder="Ej: Mayo 2026"
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm font-semibold text-blue-500 mb-1">Vencimiento *</label>
              <input
                name="vencimiento"
                type="date"
                value={form.vencimiento}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-500 mb-1">Comprobante</label>
            <input
              name="comprobante"
              value={form.comprobante}
              onChange={handleChange}
              placeholder="N° de comprobante"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-500 mb-1">Nota</label>
            <input
              name="nota"
              value={form.nota}
              onChange={handleChange}
              placeholder="Opcional..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="pagado"
              id="pagado"
              checked={form.pagado}
              onChange={handleChange}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="pagado" className="text-sm text-slate-700">
              Ya esta pagado
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