'use client'

import { useState, useEffect } from 'react'
import { formatPeso } from '@/lib/utils'
import { Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ProductoPareto {
  posicion: number
  nombre: string
  codigo: string
  cantidad: number
  ventaTotal: number
  ganancia: number
  porcentajeGanancia: number
  porcentajeAcumulado: number
  esEstrella: boolean
}

interface DataPareto {
  productos: ProductoPareto[]
  gananciaTotal: number
  totalProductos: number
  cantidadEstrella: number
  porcentajeProductos: number
}

export default function ParetoPage() {
  const [data, setData] = useState<DataPareto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/reportes/pareto')
      const json = await res.json()
      if (json.ok) setData(json.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>
  if (!data || data.productos.length === 0) {
    return <div className="p-8 text-center text-slate-400">No hay suficientes ventas para calcular el reporte</div>
  }

  return (
    <div className="p-6">
      <Link href="/dashboard/reportes" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4 cursor-pointer w-fit">
        <ArrowLeft size={16} /> Volver a Reportes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Analisis 80/20 (Pareto)</h1>
        <p className="text-slate-500 text-sm mt-1">Productos que generan la mayor parte de tu ganancia — historial completo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-yellow-500" />
            <p className="text-sm text-slate-500">Productos estrella</p>
          </div>
          <p className="text-2xl font-bold text-blue-500">{data.cantidadEstrella}</p>
          <p className="text-xs text-slate-400 mt-1">de {data.totalProductos} productos vendidos ({data.porcentajeProductos.toFixed(1)}%)</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
          <p className="text-sm text-slate-500">Ganancia generada por ellos</p>
          <p className="text-2xl font-bold text-green-600">80%</p>
          <p className="text-xs text-slate-400 mt-1">de tu ganancia total historica</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
          <p className="text-sm text-slate-500">Ganancia total historica</p>
          <p className="text-2xl font-bold text-blue-500">{formatPeso(data.gananciaTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">generada por todos los productos</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Ranking de productos por ganancia</h2>
          <p className="text-xs text-slate-400 mt-0.5">Marcados con estrella: tu 20% que genera el 80% de la ganancia</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium text-center">Cant. vendida</th>
              <th className="px-4 py-3 font-medium text-right">Venta total</th>
              <th className="px-4 py-3 font-medium text-right">Ganancia</th>
              <th className="px-4 py-3 font-medium text-right">% Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {data.productos.map(function (p) {
              return (
                <tr key={p.posicion} className={'border-b border-slate-50 hover:bg-slate-50 ' + (p.esEstrella ? 'bg-yellow-50/40' : '')}>
                  <td className="px-4 py-3 text-slate-400">{p.posicion}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.codigo || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-2">
                      {p.esEstrella && <Star size={13} className="text-yellow-500 fill-yellow-400" />}
                      {p.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{p.cantidad}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatPeso(p.ventaTotal)}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{formatPeso(p.ganancia)}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">{p.porcentajeAcumulado.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}