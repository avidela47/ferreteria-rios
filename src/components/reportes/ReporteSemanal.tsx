'use client'

import { useState, useEffect } from 'react'
import { IReporteSemanal } from '@/types'
import { formatPeso } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ReporteSemanal() {
  const [data, setData] = useState<IReporteSemanal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true)
      const res = await fetch('/api/reportes/semanal')
      const json = await res.json()
      if (json.ok) setData(json.data)
      setLoading(false)
    }
    fetchReporte()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando reporte...</div>
  if (!data) return <div className="p-8 text-center text-slate-400">No hay datos disponibles</div>

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">{data.semana}</p>

      {/* Cards */}
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
          <p className={`text-2xl font-bold ${data.ganancia - data.totalGastos >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatPeso(data.ganancia - data.totalGastos)}
          </p>
          <p className="text-xs text-slate-400 mt-1">ganancia - gastos</p>
        </div>
      </div>

      {/* Grafico ventas por dia */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="font-medium text-slate-700 mb-4">Ventas por dia</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.ventasPorDia} barCategoryGap="60%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip
              formatter={(value) => [formatPeso(Number(value)), 'Ventas']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} name="Ventas" barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top productos */}
      {data.topProductos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="font-medium text-slate-700 mb-4">Top productos</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
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
    </div>
  )
}