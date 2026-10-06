import { IProduct } from '@/types'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface Props {
  productos: IProduct[]
}

export default function StockBajoTable({ productos }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 text-orange-600 p-1.5 rounded-xl">
            <AlertTriangle size={16} />
          </div>
          <h2 className="font-bold text-blue-500">Stock bajo</h2>
        </div>
        <Link href="/dashboard/stock" className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer">
          Ver todo
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Todo el stock esta en orden</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Producto</th>
              <th className="pb-2 font-semibold text-right">Stock</th>
              <th className="pb-2 font-semibold text-right">Minimo</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-700">{p.nombre}</td>
                <td className="py-2 text-right font-semibold text-red-500">{p.cantidad} {p.unidad}</td>
                <td className="py-2 text-right text-slate-400">{p.stockMinimo} {p.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}