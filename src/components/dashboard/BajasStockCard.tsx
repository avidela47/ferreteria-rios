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
    <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-red-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-red-100 text-red-600 p-1.5 rounded-lg">
            <PackageMinus size={16} />
          </div>
          <h2 className="font-semibold text-slate-800">Bajas de stock del mes</h2>
        </div>
        <Link
          href="/dashboard/bajas-stock"
          className="text-xs text-blue-600 hover:underline cursor-pointer"
        >
          Ver todo
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-xs text-slate-400">Unidades perdidas</p>
          <p className="text-xl font-bold text-slate-800">{cantidad}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Monto perdido</p>
          <p className="text-xl font-bold text-red-500">{formatPeso(total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Registros</p>
          <p className="text-xl font-bold text-slate-800">{registros}</p>
        </div>
      </div>

      {ultimas.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          No hay bajas registradas
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2 font-medium">Producto</th>
              <th className="pb-2 font-medium">Motivo</th>
              <th className="pb-2 font-medium text-right">Cant.</th>
            </tr>
          </thead>
          <tbody>
            {ultimas.map(function (b) {
              return (
                <tr key={b._id} className="border-b last:border-0">
                  <td className="py-2 text-slate-700">{b.nombre}</td>
                  <td className="py-2">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {MOTIVOS[b.motivo] || b.motivo}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium text-slate-800">{b.cantidad}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}