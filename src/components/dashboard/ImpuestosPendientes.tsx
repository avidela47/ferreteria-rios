import { ITaxRecord } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import Link from 'next/link'
import { FileWarning } from 'lucide-react'

interface Props {
  impuestos: ITaxRecord[]
}

export default function ImpuestosPendientes({ impuestos }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-red-50 text-red-600 p-1.5 rounded-xl">
            <FileWarning size={16} />
          </div>
          <h2 className="font-bold text-blue-500">Impuestos pendientes</h2>
        </div>
        <Link href="/dashboard/impuestos" className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer">
          Ver todo
        </Link>
      </div>

      {impuestos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No hay impuestos pendientes</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Tipo</th>
              <th className="pb-2 font-semibold">Periodo</th>
              <th className="pb-2 font-semibold">Vencimiento</th>
              <th className="pb-2 font-semibold text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {impuestos.map((imp) => (
              <tr key={imp._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2">
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">{imp.tipo}</span>
                </td>
                <td className="py-2 text-slate-700">{imp.periodo}</td>
                <td className="py-2 text-slate-400 text-xs">{formatFecha(imp.vencimiento)}</td>
                <td className="py-2 text-right font-semibold text-blue-500">{formatPeso(imp.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}