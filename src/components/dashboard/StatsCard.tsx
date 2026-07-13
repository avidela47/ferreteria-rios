import { ReactNode } from 'react'

interface StatsCardProps {
  titulo: string
  valor: string
  subtitulo?: string
  color?: 'blue' | 'green' | 'orange' | 'red'
  icon?: ReactNode
  /** % de variación vs. período anterior. null/undefined = no hay dato para comparar */
  tendencia?: number | null
  /** Si true, un aumento se pinta en rojo en vez de verde (útil para gastos) */
  invertirColorTendencia?: boolean
}

const estilos = {
  blue: {
    borde: 'border-l-blue-500',
    iconoFondo: 'bg-blue-50',
    iconoTexto: 'text-blue-600',
  },
  green: {
    borde: 'border-l-emerald-500',
    iconoFondo: 'bg-emerald-50',
    iconoTexto: 'text-emerald-600',
  },
  orange: {
    borde: 'border-l-orange-500',
    iconoFondo: 'bg-orange-50',
    iconoTexto: 'text-orange-600',
  },
  red: {
    borde: 'border-l-red-500',
    iconoFondo: 'bg-red-50',
    iconoTexto: 'text-red-600',
  },
}

function FlechaArriba() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
        transform="rotate(180 10 10)"
      />
    </svg>
  )
}

function FlechaAbajo() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function StatsCard({
  titulo,
  valor,
  subtitulo,
  color = 'blue',
  icon,
  tendencia,
  invertirColorTendencia = false,
}: StatsCardProps) {
  const s = estilos[color]

  const hayTendencia = tendencia !== null && tendencia !== undefined
  const esPositiva = hayTendencia && tendencia! >= 0
  // por defecto: subir = verde (bueno). si invertirColorTendencia, subir = rojo (ej. gastos)
  const tendenciaEsBuena = invertirColorTendencia ? !esPositiva : esPositiva

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.borde} hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{titulo}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.iconoFondo} ${s.iconoTexto}`}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-slate-800 tracking-tight">{valor}</p>

      <div className="flex items-center gap-2 mt-2">
        {hayTendencia && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
              tendenciaEsBuena ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
            }`}
          >
            {esPositiva ? <FlechaArriba /> : <FlechaAbajo />}
            {Math.abs(tendencia!).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
          </span>
        )}
        {subtitulo && <p className="text-xs text-slate-400">{subtitulo}</p>}
      </div>
    </div>
  )
}
