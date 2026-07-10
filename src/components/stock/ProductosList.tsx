'use client'

import { useState, useEffect } from 'react'
import { IProduct } from '@/types'
import { formatPeso, formatPesoEntero } from '@/lib/utils'
import { Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onNuevo: () => void
  onEditar: (producto: IProduct) => void
  refresh: number
  esAdmin: boolean
}

export default function ProductosList({ onNuevo, onEditar, refresh, esAdmin }: Props) {
  const [productos, setProductos] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totales, setTotales] = useState({ costo: 0, venta: 0 })
  const [ordenarPor, setOrdenarPor] = useState('nombre')
  const [direccion, setDireccion] = useState('asc')
  const [grupoPagina, setGrupoPagina] = useState(0)
  const POR_PAGINA = 20

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true)
      const url = '/api/productos?buscar=' + buscar + '&limite=' + POR_PAGINA + '&pagina=' + pagina + '&ordenarPor=' + ordenarPor + '&direccion=' + direccion
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) {
        setProductos(json.data)
        setTotal(json.total || 0)
      }
      setLoading(false)
    }
    fetchProductos()
  }, [buscar, pagina, refresh, ordenarPor, direccion])

  useEffect(() => {
    const fetchTotales = async () => {
      const res = await fetch('/api/productos?limite=1000&pagina=1')
      const json = await res.json()
      if (json.ok) {
        const todos = json.data
        let costo = 0
        let venta = 0
        for (let i = 0; i < todos.length; i++) {
          costo = costo + (todos[i].precioCosto * todos[i].cantidad)
          venta = venta + (todos[i].precioVenta * todos[i].cantidad)
        }
        setTotales({ costo: costo, venta: venta })
      }
    }
    fetchTotales()
  }, [refresh])

  function ordenar(campo: string) {
    if (ordenarPor === campo) {
      if (direccion === 'asc') {
        setDireccion('desc')
      } else {
        setDireccion('asc')
      }
    } else {
      setOrdenarPor(campo)
      setDireccion('asc')
    }
    setPagina(1)
    setGrupoPagina(0)
  }

  async function eliminar(id: string) {
    toast('Seguro que queres eliminar este producto?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch('/api/productos/' + id, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Producto eliminado')
            setProductos(function (prev) {
              return prev.filter(function (p) {
                return p._id !== id
              })
            })
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
            onChange={function (e) {
              setBuscar(e.target.value)
              setPagina(1)
              setGrupoPagina(0)
            }}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={function () {
              setBuscar('')
              setPagina(1)
              setGrupoPagina(0)
            }}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Borrar
          </button>
          <a href={'/imprimir-stock?ordenarPor=' + ordenarPor + '&direccion=' + direccion} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Printer size={16} /><span>Imprimir PDF</span></a>
          {esAdmin && (
            <button
              onClick={onNuevo}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Nuevo
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay productos cargados</div>
        ) : (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-slate-800 select-none"
                    onClick={function () { ordenar('codigo') }}
                  >
                    <span>Codigo</span>
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-slate-800 select-none"
                    onClick={function () { ordenar('nombre') }}
                  >
                    <span>Producto</span>
                  </th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Costo</th>
                  <th className="px-4 py-3 font-medium text-right">Venta</th>
                  <th className="px-4 py-3 font-medium text-right">Margen</th>
                  {esAdmin && (
                    <th className="px-4 py-3 font-medium text-center">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {productos.map(function (p) {
                  const stockBajo = p.cantidad <= p.stockMinimo
                  return (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {stockBajo ? <AlertTriangle size={14} className="text-orange-500" /> : null}
                          <span className="font-medium text-slate-700">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.categoria && typeof p.categoria === 'object' ? p.categoria.nombre : (p.categoria || 'Sin categoria')}
                      </td>
                      <td className={'px-4 py-3 text-right font-medium ' + (stockBajo ? 'text-red-500' : 'text-slate-700')}>
                        {p.cantidad} {p.unidad}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatPeso(p.precioCosto)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
  {formatPesoEntero(p.precioVenta)}
</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {Math.round(p.margen)}%
                        </span>
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={function () { onEditar(p) }} className="text-slate-400 hover:text-blue-500 transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button onClick={function () { eliminar(p._id) }} className="text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                {total} productos - Pagina {pagina} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={function () {
                    const nuevaPagina = Math.max(1, pagina - 1)
                    setPagina(nuevaPagina)
                    setGrupoPagina(Math.floor((nuevaPagina - 1) / 3))
                  }}
                  disabled={pagina === 1}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: 3 }, function (_, i) { return grupoPagina * 3 + i + 1 })
                  .filter(function (n) { return n <= totalPaginas })
                  .map(function (n) {
                    const esUltimoDelGrupo = n === Math.min((grupoPagina + 1) * 3, totalPaginas)
                    return (
                      <button
                        key={n}
                        onClick={function () {
                          setPagina(n)
                          if (esUltimoDelGrupo && n < totalPaginas) {
                            setGrupoPagina(function (g) { return g + 1 })
                          }
                        }}
                        className={
                          'w-8 h-8 rounded text-sm transition-colors ' +
                          (n === pagina
                            ? 'bg-orange-500 text-white font-medium'
                            : 'border border-slate-200 text-slate-500 hover:bg-slate-50')
                        }
                      >
                        {n}
                      </button>
                    )
                  })}
                <button
                  onClick={function () {
                    const nuevaPagina = Math.min(totalPaginas, pagina + 1)
                    setPagina(nuevaPagina)
                    setGrupoPagina(Math.floor((nuevaPagina - 1) / 3))
                  }}
                  disabled={pagina === totalPaginas}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}