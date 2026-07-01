'use client'

import { useState, useEffect } from 'react'
import { IProduct } from '@/types'
import { formatPeso } from '@/lib/utils'
import { Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onNuevo: () => void
  onEditar: (producto: IProduct) => void
}

export default function ProductosList({ onNuevo, onEditar }: Props) {
  const [productos, setProductos] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totales, setTotales] = useState({ costo: 0, venta: 0 })
  const POR_PAGINA = 20

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true)
      const res = await fetch(`/api/productos?buscar=${buscar}&limite=${POR_PAGINA}&pagina=${pagina}`)
      const json = await res.json()
      if (json.ok) {
        setProductos(json.data)
        setTotal(json.total ?? 0)
      }
      setLoading(false)
    }
    fetchProductos()
  }, [buscar, pagina])

  useEffect(() => {
    const fetchTotales = async () => {
      const res = await fetch('/api/productos?limite=1000&pagina=1')
      const json = await res.json()
      if (json.ok) {
        const todos: IProduct[] = json.data
        const costo = todos.reduce((acc, p) => acc + (p.precioCosto * p.cantidad), 0)
        const venta = todos.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0)
        setTotales({ costo, venta })
      }
    }
    fetchTotales()
  }, [])

  async function eliminar(id: string) {
    toast('¿Seguro que querés eliminar este producto?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Producto eliminado')
            setProductos((prev) => prev.filter((p) => p._id !== id))
          } else {
            toast.error('Error al eliminar')
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    })
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-4">
      {/* Cards resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total productos</p>
          <p className="text-2xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Costo total stock</p>
          <p className="text-2xl font-bold text-slate-800">{formatPeso(totales.costo)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Venta total stock</p>
          <p className="text-2xl font-bold text-orange-500">{formatPeso(totales.venta)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={buscar}
            onChange={(e) => {
              setBuscar(e.target.value)
              setPagina(1)
            }}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={onNuevo}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nuevo
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay productos cargados</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Costo</th>
                  <th className="px-4 py-3 font-medium text-right">Venta</th>
                  <th className="px-4 py-3 font-medium text-right">Margen</th>
                  <th className="px-4 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const stockBajo = p.cantidad <= p.stockMinimo
                  return (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {stockBajo && <AlertTriangle size={14} className="text-orange-500" />}
                          <span className="font-medium text-slate-700">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.categoria && typeof p.categoria === 'object' ? p.categoria.nombre : (p.categoria ?? 'Sin categoría')}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${stockBajo ? 'text-red-500' : 'text-slate-700'}`}>
                        {p.cantidad} {p.unidad}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatPeso(p.precioCosto)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {formatPeso(p.precioVenta)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {Math.round(p.margen)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onEditar(p)} className="text-slate-400 hover:text-blue-500 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => eliminar(p._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                {total} productos · Página {pagina} de {totalPaginas}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}