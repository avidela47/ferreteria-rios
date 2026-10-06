'use client'

import { useState, useEffect } from 'react'
import { IReporteMensual } from '@/types'
import { formatPeso } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORES = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']

export default function ReporteMensual() {
  const [data, setData] = useState<IReporteMensual | null>(null)
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true)
      const res = await fetch(`/api/reportes/mensual?mes=${mes}&anio=${anio}`)
      const json = await res.json()
      if (json.ok) setData(json.data)
      setLoading(false)
    }
    fetchReporte()
  }, [mes, anio])

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const anios = [2024, 2025, 2026, 2027]

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="flex items-center gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {meses.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {anios.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Cargando reporte...</div>
      ) : !data ? (
        <div className="p-8 text-center text-slate-400">No hay datos disponibles</div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-sm text-slate-500">Ventas del mes</p>
              <p className="text-2xl font-bold text-blue-500">{formatPeso(data.totalVentas)}</p>
              <p className="text-xs text-slate-400 mt-1">{data.cantidadVentas} transacciones</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-green-500">
              <p className="text-sm text-slate-500">Ganancia bruta</p>
              <p className="text-2xl font-bold text-blue-500">{formatPeso(data.ganancia)}</p>
              <p className="text-xs text-slate-400 mt-1">costo {formatPeso(data.totalCostos)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
              <p className="text-sm text-slate-500">Gastos del mes</p>
              <p className="text-2xl font-bold text-blue-500">{formatPeso(data.totalGastos)}</p>
              <p className="text-xs text-slate-400 mt-1">impuestos {formatPeso(data.totalImpuestos)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-orange-500">
              <p className="text-sm text-slate-500">Resultado neto</p>
              <p className={`text-2xl font-bold ${data.ganancia - data.totalGastos - data.totalImpuestos >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatPeso(data.ganancia - data.totalGastos - data.totalImpuestos)}
              </p>
              <p className="text-xs text-slate-400 mt-1">compras {formatPeso(data.totalCompras)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por semana */}
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <h3 className="font-medium text-slate-700 mb-4">Ventas por semana</h3>
              {data.ventasPorSemana.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.ventasPorSemana} barCategoryGap="60%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
  contentStyle={{ fontSize: 12, borderRadius: 8 }}
/>
                    <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} name="Ventas" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gastos por categoria */}
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <h3 className="font-medium text-slate-700 mb-4">Gastos por categoria</h3>
              {data.gastosPorCategoria.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin gastos registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
  <PieChart>
    <Pie
      data={data.gastosPorCategoria}
      dataKey="total"
      nameKey="categoria"
      cx="50%"
      cy="50%"
      outerRadius={70}
    >
      {data.gastosPorCategoria.map((_, i) => (
        <Cell key={i} fill={COLORES[i % COLORES.length]} />
      ))}
    </Pie>
    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
    <Legend formatter={(value) => value} />
  </PieChart>
</ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top productos */}
          {data.topProductos.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <h3 className="font-medium text-slate-700 mb-4">Top 10 productos del mes</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-center">Cantidad</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 text-slate-700">{p.nombre}</td>
                      <td className="py-2 text-center text-slate-500">{p.cantidad}</td>
                      <td className="py-2 text-right font-medium">{formatPeso(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}