'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { formatPeso } from '@/lib/utils'
import { COLORES, TOOLTIP_STYLE } from '@/lib/colores'

interface Punto {
  dia: number
  ventasAcumuladas: number
  gananciaAcumulada: number
  gastosFijosAcumulados: number
}

interface Props {
  data: Punto[]
  puntoEquilibrio?: number | null
}

const NOMBRES: Record<string, string> = {
  ventasAcumuladas: 'Ventas',
  gananciaAcumulada: 'Ganancia',
  gastosFijosAcumulados: 'Gastos fijos',
}

export default function VentasChart({ data, puntoEquilibrio }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-blue-500">Progreso del mes vs. punto de equilibrio</h3>
      </div>
      <div className="relative h-64 w-full min-w-0 overflow-hidden">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Día del mes', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#cbd5e1' }}
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
                  const clave = String(name)
                  return [formatPeso(Number(value ?? 0)), NOMBRES[clave] ?? clave]
                }}
                labelFormatter={function (label) { return 'Día ' + label }}
                contentStyle={TOOLTIP_STYLE}
              />
              <Line type="monotone" dataKey="ventasAcumuladas" stroke={COLORES.naranja} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="gananciaAcumulada" stroke={COLORES.navy} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="gastosFijosAcumulados" stroke={COLORES.gris} strokeWidth={2} strokeDasharray="4 2" dot={false} />
              {puntoEquilibrio != null && (
                <ReferenceLine
                  y={puntoEquilibrio}
                  ifOverflow="extendDomain"
                  stroke={COLORES.navyOscuro}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{ value: 'Punto de equilibrio', position: 'insideTopRight', fontSize: 10, fontWeight: 600, fill: COLORES.navyOscuro }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Ventas acumuladas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Ganancia acumulada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Gastos fijos acumulados</span>
        {puntoEquilibrio != null && (
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-blue-900 inline-block" /> Punto de equilibrio</span>
        )}
      </div>
    </div>
  )
}