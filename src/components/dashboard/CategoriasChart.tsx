'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PALETA_CATEGORIAS, TOOLTIP_STYLE } from '@/lib/colores'

interface Item {
  categoria: string
  cantidad: number
}

interface Props {
  data: Item[]
}

export default function CategoriasChart({ data }: Props) {
  const total = data.reduce(function (acc, d) { return acc + d.cantidad }, 0)

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 min-w-0 overflow-hidden">
      <h3 className="text-sm font-bold text-blue-500 mb-4">Productos por categoría</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="cantidad"
                nameKey="categoria"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map(function (_, i) {
                  return <Cell key={i} fill={PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length]} />
                })}
              </Pie>
              <Tooltip
                formatter={function (value, name) {
                  return [Number(value ?? 0) + ' productos', name]
                }}
                contentStyle={TOOLTIP_STYLE}
                wrapperStyle={{ zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-blue-500">{total}</span>
            <span className="text-[10px] text-slate-400">productos</span>
          </div>
        </div>
        <div className="w-full sm:flex-1 min-w-0 space-y-1.5">
          {data.map(function (item, i) {
            const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0
            return (
              <div key={item.categoria} className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-slate-600 truncate min-w-0">
                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length] }} />
                  <span className="truncate">{item.categoria}</span>
                </span>
                <span className="text-slate-400 shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}