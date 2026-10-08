'use client'

import { useState, useEffect } from 'react'
import { IExpense } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onNuevo: () => void
  onEditar: (gasto: IExpense) => void
  anio: number
  mes: number
}

const categoriaColors: Record<string, string> = {
  alquiler: 'bg-blue-100 text-blue-700',
  servicios: 'bg-purple-100 text-purple-700',
  flete: 'bg-yellow-100 text-yellow-700',
  impuestos: 'bg-red-100 text-red-700',
  sueldos: 'bg-green-100 text-green-700',
  mantenimiento: 'bg-orange-100 text-orange-700',
  otros: 'bg-slate-100 text-slate-600',
}

export default function GastosList({ onNuevo, onEditar, anio, mes }: Props) {
  const [gastos, setGastos] = useState<IExpense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGastos = async () => {
      setLoading(true)
      const desde = new Date(anio, mes, 1).toISOString()
      const hasta = new Date(anio, mes + 1, 0, 23, 59, 59).toISOString()
      const res = await fetch('/api/gastos?limite=100&desde=' + desde + '&hasta=' + hasta)
      const json = await res.json()
      if (json.ok) setGastos(json.data)
      setLoading(false)
    }
    fetchGastos()
  }, [anio, mes])

  async function eliminar(id: string) {
    const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      toast.success('Gasto eliminado')
      setGastos((prev) => prev.filter((g) => g._id !== id))
    } else {
      toast.error(json.error ?? 'Error al eliminar')
    }
  }

  const recurrentes = gastos.filter(function (g) { return g.recurrente })
  const noRecurrentes = gastos.filter(function (g) { return !g.recurrente })

  const totalRecurrentes = recurrentes.reduce(function (acc, g) { return acc + g.monto }, 0)
  const totalNoRecurrentes = noRecurrentes.reduce(function (acc, g) { return acc + g.monto }, 0)
  const totalGeneral = totalRecurrentes + totalNoRecurrentes

  function tabla(lista: IExpense[]) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="px-4 py-3 font-medium">Descripcion</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium text-right">Monto</th>
            <th className="px-4 py-3 font-medium text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(function (g) {
            return (
              <tr key={g._id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{g.descripcion}</td>
                <td className="px-4 py-3">
                  <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + categoriaColors[g.categoria]}>
                    {g.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatFecha(g.fecha)}</td>
                <td className="px-4 py-3 text-right font-medium text-red-500">
                  {formatPeso(g.monto)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={function () { onEditar(g) }}
                      className="text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={function () { eliminar(g._id) }}
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
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-8 text-center text-slate-400 text-sm">
        Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Total gastado este mes</p>
          <p className="text-2xl font-bold text-blue-500">{formatPeso(totalGeneral)}</p>
        </div>
        <button
          onClick={onNuevo}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          + Nuevo gasto
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-medium text-slate-700">Gastos recurrentes (mensuales)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Estos son los que definen el punto de equilibrio</p>
          </div>
          {recurrentes.length > 0 && (
            <p className="text-sm text-slate-500">
              Total: <span className="font-medium text-red-500">{formatPeso(totalRecurrentes)}</span>
            </p>
          )}
        </div>
        {recurrentes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay gastos recurrentes este mes
          </div>
        ) : (
          tabla(recurrentes)
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Otros gastos e inversiones</h2>
          <p className="text-xs text-slate-400 mt-0.5">Compras únicas, mercadería, mejoras - no entran en el punto de equilibrio</p>
          {noRecurrentes.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              Total: <span className="font-medium text-red-500">{formatPeso(totalNoRecurrentes)}</span>
            </p>
          )}
        </div>
        {noRecurrentes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay otros gastos este mes
          </div>
        ) : (
          tabla(noRecurrentes)
        )}
      </div>
    </div>
  )
}