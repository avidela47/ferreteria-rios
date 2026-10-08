'use client'

import { useState, useEffect } from 'react'
import { ITaxRecord } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import { Pencil, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onNuevo: () => void
  onEditar: (impuesto: ITaxRecord) => void
}

const tipoColors: Record<string, string> = {
  IVA: 'bg-blue-100 text-blue-700',
  IIBB: 'bg-purple-100 text-purple-700',
  monotributo: 'bg-green-100 text-green-700',
  municipal: 'bg-yellow-100 text-yellow-700',
  otro: 'bg-slate-100 text-slate-600',
}

export default function ImpuestosList({ onNuevo, onEditar }: Props) {
  const [impuestos, setImpuestos] = useState<ITaxRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImpuestos = async () => {
      setLoading(true)
      const res = await fetch('/api/impuestos?limite=50')
      const json = await res.json()
      if (json.ok) setImpuestos(json.data)
      setLoading(false)
    }
    fetchImpuestos()
  }, [])

  async function marcarPagado(id: string) {
    const res = await fetch(`/api/impuestos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagado: true }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Impuesto marcado como pagado')
      setImpuestos((prev) =>
        prev.map((i) => (i._id === id ? { ...i, pagado: true } : i))
      )
    } else {
      toast.error(json.error ?? 'Error al actualizar')
    }
  }

  async function eliminar(id: string) {
    const res = await fetch(`/api/impuestos/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      toast.success('Registro eliminado')
      setImpuestos((prev) => prev.filter((i) => i._id !== id))
    } else {
      toast.error(json.error ?? 'Error al eliminar')
    }
  }

  const totalPendiente = impuestos
    .filter((i) => !i.pagado)
    .reduce((acc, i) => acc + i.monto, 0)

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-slate-700">Registro de impuestos</h2>
          {totalPendiente > 0 && (
            <p className="text-sm text-slate-400 mt-0.5">
              Pendiente: <span className="font-medium text-red-500">{formatPeso(totalPendiente)}</span>
            </p>
          )}
        </div>
        <button
          onClick={onNuevo}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : impuestos.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay impuestos registrados
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Periodo</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium text-right">Monto</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {impuestos.map((i) => {
              const vencido = !i.pagado && new Date(i.vencimiento) < new Date()
              return (
                <tr key={i._id} className={`border-b border-slate-50 hover:bg-slate-50 ${i.pagado ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColors[i.tipo]}`}>
                      {i.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{i.periodo}</td>
                  <td className={`px-4 py-3 text-xs ${vencido ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                    {formatFecha(i.vencimiento)}
                    {vencido && <span className="ml-1">⚠ Vencido</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-blue-500">
                    {formatPeso(i.monto)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {i.pagado ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Pagado
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {!i.pagado && (
                        <button
                          onClick={() => marcarPagado(i._id)}
                          className="text-slate-400 hover:text-green-500 transition-colors"
                          title="Marcar como pagado"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => onEditar(i)}
                        className="text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => eliminar(i._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}