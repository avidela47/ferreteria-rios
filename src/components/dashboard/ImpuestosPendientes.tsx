import { ITaxRecord } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  impuestos: ITaxRecord[]
}

export default function ImpuestosPendientes({ impuestos }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Impuestos pendientes</h2>
        <Link
          href="/dashboard/impuestos"
          className="text-xs text-blue-600 hover:underline cursor-pointer"
        >
          Ver todo
        </Link>
      </div>

      {impuestos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No hay impuestos pendientes
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 font-medium">Periodo</th>
              <th className="pb-2 font-medium">Vencimiento</th>
              <th className="pb-2 font-medium text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {impuestos.map((imp) => (
              <tr key={imp._id} className="border-b last:border-0">
                <td className="py-2">
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {imp.tipo}
                  </span>
                </td>
                <td className="py-2 text-slate-700">{imp.periodo}</td>
                <td className="py-2 text-slate-400 text-xs">
                  {formatFecha(imp.vencimiento)}
                </td>
                <td className="py-2 text-right font-medium text-slate-800">
                  {formatPeso(imp.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}