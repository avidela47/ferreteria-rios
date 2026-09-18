'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Item {
  categoria: string
  cantidad: number
}

interface Props {
  data: Item[]
}

const COLORES = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#94a3b8']

export default function CategoriasChart({ data }: Props) {
  const total = data.reduce(function (acc, d) { return acc + d.cantidad }, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Productos por categoría</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
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
                  return <Cell key={i} fill={COLORES[i % COLORES.length]} />
                })}
              </Pie>
              <Tooltip
                formatter={function (value, name) {
                  return [Number(value ?? 0) + ' productos', name]
                }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800">{total}</span>
            <span className="text-[10px] text-slate-400">productos</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.map(function (item, i) {
            const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0
            return (
              <div key={item.categoria} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: COLORES[i % COLORES.length] }}
                  />
                  {item.categoria}
                </span>
                <span className="text-slate-400 shrink-0 ml-2">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}