'use client'

import { useState, useEffect } from 'react'
import { IProduct } from '@/types'
import { formatPeso } from '@/lib/utils'

export default function ImprimirStockPage() {
  const [productos, setProductos] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodos = async () => {
      const params = new URLSearchParams(window.location.search)
      const ordenarPor = params.get('ordenarPor') || 'nombre'
      const direccion = params.get('direccion') || 'asc'
      const res = await fetch('/api/productos?limite=2000&pagina=1&ordenarPor=' + ordenarPor + '&direccion=' + direccion)
      const json = await res.json()
      if (json.ok) setProductos(json.data)
      setLoading(false)
    }
    fetchTodos()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-4 print:hidden">
        <button onClick={function () { window.print() }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Imprimir / Guardar como PDF</button>
      </div>

      <h1 className="text-xl font-bold mb-4">Listado de Stock - Ferreteria Rios</h1>

      <table className="w-full text-xs border-collapse">
        <thead style={{ display: 'table-header-group' }}>
          <tr className="bg-slate-800 text-white">
            <th className="border px-2 py-1 text-left">Codigo</th>
            <th className="border px-2 py-1 text-left">Producto</th>
            <th className="border px-2 py-1 text-left">Categoria</th>
            <th className="border px-2 py-1 text-right">Stock</th>
            <th className="border px-2 py-1 text-right">Costo</th>
            <th className="border px-2 py-1 text-right">Venta</th>
            <th className="border px-2 py-1 text-right">Margen</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(function (p) {
            return (
              <tr key={p._id} style={{ pageBreakInside: 'avoid' }}>
                <td className="border px-2 py-1">{p.codigo}</td>
                <td className="border px-2 py-1">{p.nombre}</td>
                <td className="border px-2 py-1">{p.categoria && typeof p.categoria === 'object' ? p.categoria.nombre : (p.categoria || '')}</td>
                <td className="border px-2 py-1 text-right">{p.cantidad} {p.unidad}</td>
                <td className="border px-2 py-1 text-right">{formatPeso(p.precioCosto)}</td>
                <td className="border px-2 py-1 text-right">{formatPeso(p.precioVenta)}</td>
                <td className="border px-2 py-1 text-right">{Math.round(p.margen)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}