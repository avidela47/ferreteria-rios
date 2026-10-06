'use client'

import { useState, useEffect } from 'react'
import { IPurchase } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

const estadoColors: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  enviada: 'bg-blue-100 text-blue-700',
  recibida: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default function ComprasList() {
  const [compras, setCompras] = useState<IPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCompras = async () => {
      setLoading(true)
      const res = await fetch('/api/compras?limite=50')
      const json = await res.json()
      if (json.ok) setCompras(json.data)
      setLoading(false)
    }
    fetchCompras()
  }, [])

  async function cambiarEstado(id: string, estado: string) {
    const res = await fetch(`/api/compras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success(json.mensaje)
      setCompras((prev) =>
        prev.map((c) => (c._id === id ? { ...c, estado: estado as IPurchase['estado'] } : c))
      )
    } else {
      toast.error(json.error ?? 'Error al actualizar')
    }
  }

  async function cancelar(id: string) {
    const res = await fetch(`/api/compras/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      toast.success('Orden cancelada')
      setCompras((prev) =>
        prev.map((c) => (c._id === id ? { ...c, estado: 'cancelada' as const } : c))
      )
    } else {
      toast.error(json.error ?? 'Error al cancelar')
    }
  }

  async function eliminarDefinitivo(id: string) {
    toast('Seguro que queres eliminar esta orden definitivamente?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch(`/api/compras/${id}?definitivo=true`, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Orden eliminada')
            setCompras((prev) => prev.filter((c) => c._id !== id))
          } else {
            toast.error(json.error ?? 'Error al eliminar')
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    })
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-medium text-slate-700">Ordenes de compra</h2>
        <p className="text-sm text-slate-500">
          Total: <span className="font-semibold text-orange-500">{formatPeso(compras.reduce(function (acc, c) { return acc + c.total }, 0))}</span>
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : compras.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay ordenes de compra
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium text-center">Items</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c._id} className={`border-b border-slate-50 hover:bg-slate-50 ${c.estado === 'cancelada' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-500">#{c.numero}</td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {typeof c.proveedor === 'object' ? c.proveedor.nombre : c.proveedor}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatFecha(c.createdAt)}
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {c.items.length}
                </td>
                <td className="px-4 py-3 text-right font-medium text-blue-500">
                  {formatPeso(c.total)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColors[c.estado]}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/compras/${c._id}`)}
                      className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      Ver
                    </button>
                    {c.estado === 'borrador' && (
                      <button
                        onClick={() => cambiarEstado(c._id, 'enviada')}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Enviar
                      </button>
                    )}
                    {c.estado === 'enviada' && (
                      <button
                        onClick={() => cambiarEstado(c._id, 'recibida')}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Recibir
                      </button>
                    )}
                    {c.estado === 'enviada' && (
                      <button
                        onClick={() => cancelar(c._id)}
                        className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    {c.estado !== 'recibida' && (
                      <button
                        onClick={() => eliminarDefinitivo(c._id)}
                        className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                        title="Eliminar definitivamente"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}