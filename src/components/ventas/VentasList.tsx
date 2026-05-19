'use client'

import { useState, useEffect } from 'react'
import { ISale } from '@/types'
import { formatPeso, formatFechaHora } from '@/lib/utils'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'

export default function VentasList() {
  const [ventas, setVentas] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true)
      const res = await fetch('/api/ventas?limite=50')
      const json = await res.json()
      if (json.ok) setVentas(json.data)
      setLoading(false)
    }
    fetchVentas()
  }, [])

  async function anularVenta(id: string) {
    const res = await fetch(`/api/ventas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'anulada' }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Venta anulada — stock restaurado')
      setVentas((prev) =>
        prev.map((v) => (v._id === id ? { ...v, estado: 'anulada' as const } : v))
      )
    } else {
      toast.error('Solo el administrador puede anular ventas')
    }
  }

  const formaPagoBadge = (forma: string) => {
    const colores: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-700',
      tarjeta: 'bg-blue-100 text-blue-700',
      transferencia: 'bg-purple-100 text-purple-700',
      posnet: 'bg-indigo-100 text-indigo-700',
    }
    return colores[forma] ?? 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-medium text-slate-700">Historial de ventas</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : ventas.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay ventas registradas
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Forma pago</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Ganancia</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-center">Items</th>
              <th className="px-4 py-3 font-medium text-center">Accion</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v._id} className={`border-b border-slate-50 hover:bg-slate-50 ${v.estado === 'anulada' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-slate-500 font-medium">#{v.numero}</td>
                <td className="px-4 py-3 text-slate-700">{v.cliente}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatFechaHora(v.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${formaPagoBadge(v.formaPago)}`}>
                    {v.formaPago}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {formatPeso(v.total)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">
                  {formatPeso(v.ganancia)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.estado === 'completada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {v.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {v.items.length}
                </td>
                <td className="px-4 py-3 text-center">
                  {v.estado === 'completada' && (
                    <button
                      onClick={() => anularVenta(v._id)}
                      className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                      title="Anular venta"
                    >
                      <Ban size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}