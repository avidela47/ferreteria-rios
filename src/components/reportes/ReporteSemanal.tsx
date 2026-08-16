'use client'

import { useState, useEffect } from 'react'
import { formatPeso } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DiaSemana {
  dia: string
  total: number
}

interface TopProducto {
  nombre: string
  cantidad: number
  total: number
}

interface ReporteSemanalData {
  inicioSemana: string
  finSemana: string
  totalVentas: number
  totalCostos: number
  ganancia: number
  totalGastos: number
  cantidadVentas: number
  diasSemana: DiaSemana[]
  topProductos: TopProducto[]
}

function lunesDeEstaSemana() {
  const ahora = new Date()
  const dia = ahora.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const lunes = new Date(ahora)
  lunes.setDate(ahora.getDate() + diff)
  return lunes
}

function formatFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function toISODate(fecha: Date) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

export default function ReporteSemanal() {
  const [data, setData] = useState<ReporteSemanalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lunesSeleccionado, setLunesSeleccionado] = useState(lunesDeEstaSemana())

  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true)
      const res = await fetch('/api/reportes/semanal?semanaInicio=' + toISODate(lunesSeleccionado))
      const json = await res.json()
      if (json.ok) setData(json.data)
      setLoading(false)
    }
    fetchReporte()
  }, [lunesSeleccionado])

  function semanaAnterior() {
    const nueva = new Date(lunesSeleccionado)
    nueva.setDate(nueva.getDate() - 7)
    setLunesSeleccionado(nueva)
  }

  function semanaSiguiente() {
    const nueva = new Date(lunesSeleccionado)
    nueva.setDate(nueva.getDate() + 7)
    setLunesSeleccionado(nueva)
  }

  const domingo = new Date(lunesSeleccionado)
  domingo.setDate(domingo.getDate() + 6)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 bg-white rounded-lg shadow-sm p-3">
        <button
          onClick={semanaAnterior}
          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-slate-800 w-56 text-center">
          {formatFechaCorta(lunesSeleccionado)} al {formatFechaCorta(domingo)}
        </span>
        <button
          onClick={semanaSiguiente}
          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Cargando reporte...</div>
      ) : !data ? (
        <div className="p-8 text-center text-slate-400">No hay datos disponibles</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-sm text-slate-500">Ventas</p>
              <p className="text-2xl font-bold text-slate-800">{formatPeso(data.totalVentas)}</p>
              <p className="text-xs text-slate-400 mt-1">{data.cantidadVentas} transacciones</p>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-l-green-500">
              <p className="text-sm text-slate-500">Ganancia bruta</p>
              <p className="text-2xl font-bold text-slate-800">{formatPeso(data.ganancia)}</p>
              <p className="text-xs text-slate-400 mt-1">sobre costo {formatPeso(data.totalCostos)}</p>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-l-red-500">
              <p className="text-sm text-slate-500">Gastos</p>
              <p className="text-2xl font-bold text-slate-800">{formatPeso(data.totalGastos)}</p>
              <p className="text-xs text-slate-400 mt-1">egresos del periodo</p>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-l-orange-500">
              <p className="text-sm text-slate-500">Resultado neto</p>
              <p className={'text-2xl font-bold ' + (data.ganancia - data.totalGastos >= 0 ? 'text-green-600' : 'text-red-500')}>
                {formatPeso(data.ganancia - data.totalGastos)}
              </p>
              <p className="text-xs text-slate-400 mt-1">ganancia - gastos</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-medium text-slate-700 mb-4">Ventas por dia</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.diasSemana} barCategoryGap="60%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={function (value) { return [formatPeso(Number(value)), 'Ventas'] }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} name="Ventas" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {data.topProductos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="font-medium text-slate-700 mb-4">Top 10 productos de la semana</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-center">Cantidad</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.map(function (p, i) {
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 text-slate-700">{p.nombre}</td>
                        <td className="py-2 text-center text-slate-500">{p.cantidad}</td>
                        <td className="py-2 text-right font-medium">{formatPeso(p.total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}