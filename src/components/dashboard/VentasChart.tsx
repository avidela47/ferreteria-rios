'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatPeso } from '@/lib/utils'

interface Punto {
  fecha: string
  total: number
  ganancia: number
}

interface Props {
  data: Punto[]
}

export default function VentasChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Ventas últimos 30 días</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={function (v) { return v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v) }}
            />
            <Tooltip
              formatter={function (value, name) {
                return [formatPeso(Number(value ?? 0)), name === 'total' ? 'Ventas' : 'Ganancia']
              }}
              labelFormatter={function (label) { return 'Día ' + label }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="ganancia" stroke="#22c55e" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Ventas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Ganancia</span>
      </div>
    </div>
  )
}