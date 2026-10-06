'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ISale } from '@/types'
import { formatPeso, formatFechaHora } from '@/lib/utils'
import { Ban, Eye, X, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

export default function VentasList() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [ventas, setVentas] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)
  const [ventaDetalle, setVentaDetalle] = useState<ISale | null>(null)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const POR_PAGINA = 50

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true)
      const res = await fetch('/api/ventas?limite=' + POR_PAGINA + '&pagina=' + pagina)
      const json = await res.json()
      if (json.ok) {
        setVentas(json.data)
        setTotal(json.total ?? 0)
      }
      setLoading(false)
    }
    fetchVentas()
  }, [pagina])

  function anularVenta(id: string) {
    toast('Seguro que queres anular esta venta? El stock se va a restaurar.', {
      action: {
        label: 'Anular',
        onClick: async () => {
          const res = await fetch('/api/ventas/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'anulada' }),
          })
          const json = await res.json()
          if (json.ok) {
            toast.success('Venta anulada — stock restaurado')
            setVentas(function (prev) {
              return prev.map(function (v) {
                return v._id === id ? Object.assign({}, v, { estado: 'anulada' }) : v
              })
            })
          } else {
            toast.error('Solo el administrador puede anular ventas')
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    })
  }

  const formaPagoBadge = function (forma: string) {
    const colores: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-700',
      tarjeta: 'bg-blue-100 text-blue-700',
      transferencia: 'bg-purple-100 text-purple-700',
      posnet: 'bg-indigo-100 text-indigo-700',
    }
    return colores[forma] || 'bg-slate-100 text-slate-700'
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-medium text-slate-700">Historial de ventas</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : ventas.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No hay ventas registradas
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Forma pago</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Ganancia</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Items</th>
                <th className="px-4 py-3 font-medium text-center">Accion</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(function (v) {
                return (
                  <tr key={v._id} className={'border-b border-slate-50 hover:bg-slate-50 ' + (v.estado === 'anulada' ? 'opacity-50' : '')}>
                    <td className="px-4 py-3 text-slate-500 font-medium">#{v.numero}</td>
                    <td className="px-4 py-3 text-slate-700">{v.cliente}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {formatFechaHora(v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + formaPagoBadge(v.formaPago)}>
                        {v.formaPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-500">
                      {formatPeso(v.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {formatPeso(v.ganancia)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (v.estado === 'completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {v.items.length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={function () { setVentaDetalle(v) }}
                          className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                        {esAdmin && v.estado === 'completada' && (
                          <button
                            onClick={function () { anularVenta(v._id) }}
                            className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                            title="Anular venta"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              {total} ventas · Página {pagina} de {totalPaginas}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={function () { setPagina(Math.max(1, pagina - 1)) }}
                disabled={pagina === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={function () { setPagina(Math.min(totalPaginas, pagina + 1)) }}
                disabled={pagina === totalPaginas}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {ventaDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-blue-500">Venta #{ventaDetalle.numero}</h2>
              <div className="flex items-center gap-3">
                <a href={'/imprimir-venta?id=' + ventaDetalle._id} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors" title="Imprimir ticket"><Printer size={18} /></a>
                <button onClick={function () { setVentaDetalle(null) }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Cliente</p>
                  <p className="font-medium text-slate-700">{ventaDetalle.cliente}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Forma de pago</p>
                  <p className="font-medium text-slate-700 capitalize">{ventaDetalle.formaPago}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fecha</p>
                  <p className="font-medium text-slate-700">{formatFechaHora(ventaDetalle.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Estado</p>
                  <p className="font-medium text-slate-700 capitalize">{ventaDetalle.estado}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Productos</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
                      <th className="py-2 font-medium">Código</th>
                      <th className="py-2 font-medium">Producto</th>
                      <th className="py-2 font-medium text-center">Cant.</th>
                      <th className="py-2 font-medium text-right">P. Unit.</th>
                      <th className="py-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaDetalle.items.map(function (item, i) {
                      return (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 text-slate-500 text-xs">{item.codigo || '-'}</td>
                          <td className="py-2 text-slate-700">{item.nombre}</td>
                          <td className="py-2 text-center text-slate-500">{item.cantidad}</td>
                          <td className="py-2 text-right text-slate-500">{formatPeso(item.precioVenta)}</td>
                          <td className="py-2 text-right font-medium text-blue-500">{formatPeso(item.subtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {ventaDetalle.nota && (
                <div>
                  <p className="text-xs text-slate-400">Nota</p>
                  <p className="text-sm text-slate-700">{ventaDetalle.nota}</p>
                </div>
              )}

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Costo total</span>
                  <span className="text-slate-500">{formatPeso(ventaDetalle.costoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ganancia</span>
                  <span className="text-green-600 font-medium">{formatPeso(ventaDetalle.ganancia)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">{formatPeso(ventaDetalle.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}