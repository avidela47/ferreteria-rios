import { ISale } from '@/types'
import { formatPeso, formatFechaHora } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

interface Props {
  ventas: ISale[]
}

export default function UltimasVentas({ ventas }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
            <ShoppingCart size={16} />
          </div>
          <h2 className="font-semibold text-slate-800">Ultimas ventas</h2>
        </div>
        <Link
          href="/dashboard/ventas"
          className="text-xs text-blue-600 hover:underline cursor-pointer"
        >
          Ver todo
        </Link>
      </div>

      {ventas.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No hay ventas registradas
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2 font-medium">N°</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v._id} className="border-b last:border-0">
                <td className="py-2 text-slate-500">#{v.numero}</td>
                <td className="py-2 text-slate-700">{v.cliente}</td>
                <td className="py-2 text-slate-400 text-xs">
                  {formatFechaHora(v.createdAt)}
                </td>
                <td className="py-2 text-right font-medium text-slate-800">
                  {formatPeso(v.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}