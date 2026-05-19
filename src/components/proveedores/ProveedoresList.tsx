'use client'

import { useState, useEffect } from 'react'
import { ISupplier } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  onNuevo: () => void
  onEditar: (proveedor: ISupplier) => void
}

export default function ProveedoresList({ onNuevo, onEditar }: Props) {
  const [proveedores, setProveedores] = useState<ISupplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProveedores = async () => {
      setLoading(true)
      const res = await fetch('/api/proveedores')
      const json = await res.json()
      if (json.ok) setProveedores(json.data)
      setLoading(false)
    }
    fetchProveedores()
  }, [])

  async function eliminar(id: string) {
    const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) setProveedores((prev) => prev.filter((p) => p._id !== id))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-medium text-slate-700">Lista de proveedores</h2>
        <button
          onClick={onNuevo}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : proveedores.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay proveedores cargados
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Telefono</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">CUIT</th>
              <th className="px-4 py-3 font-medium">Direccion</th>
              <th className="px-4 py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{p.telefono || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.email || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.cuit || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.direccion || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEditar(p)}
                      className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => eliminar(p._id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
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