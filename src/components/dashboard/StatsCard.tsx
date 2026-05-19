interface StatsCardProps {
  titulo: string
  valor: string
  subtitulo?: string
  color?: 'blue' | 'green' | 'orange' | 'red'
}

const colores = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
}

export default function StatsCard({ titulo, valor, subtitulo, color = 'blue' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-lg p-5 shadow-sm border-l-4 ${colores[color]}`}>
      <p className="text-sm text-slate-500 mb-1">{titulo}</p>
      <p className="text-2xl font-bold text-slate-800">{valor}</p>
      {subtitulo && <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>}
    </div>
  )
}