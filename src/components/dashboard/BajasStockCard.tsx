import { IBajaStock } from '@/types'
import { formatPeso } from '@/lib/utils'
import Link from 'next/link'
import { PackageMinus } from 'lucide-react'

interface Props {
  cantidad: number
  total: number
  registros: number
  ultimas: IBajaStock[]
}

const MOTIVOS: Record<string, string> = {
  rotura: 'Rotura',
  uso_interno: 'Uso interno',
  perdida: 'Pérdida / robo',
  otro: 'Otro',
}

export default function BajasStockCard({ cantidad, total, registros, ultimas }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-red-50 text-red-600 p-1.5 rounded-xl">
            <PackageMinus size={16} />
          </div>
          <h2 className="font-bold text-blue-500">Bajas de stock del mes</h2>
        </div>
        <Link href="/dashboard/bajas-stock" className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer">
          Ver todo
        </Link>
      </div>

      <div className="flex items-center gap-5 mb-3">
        <div>
          <p className="text-xs text-slate-400">Unidades</p>
          <p className="text-lg font-bold text-blue-500">{cantidad}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Monto perdido</p>
          <p className="text-lg font-bold text-red-500">{formatPeso(total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Registros</p>
          <p className="text-lg font-bold text-blue-500">{registros}</p>
        </div>
      </div>

      {ultimas.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No hay bajas registradas</p>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {ultimas.slice(0, 3).map(function (b) {
              return (
                <tr key={b._id} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-700">{b.nombre}</td>
                  <td className="py-1.5">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {MOTIVOS[b.motivo] || b.motivo}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-semibold text-blue-500">{b.cantidad}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}