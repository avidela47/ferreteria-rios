'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { Trash2, Eye, CheckCircle } from 'lucide-react'
import { formatPeso } from '@/lib/utils'

interface Producto {
  _id: string
  codigo?: string
  nombre: string
  precioVenta: number
  precioCosto: number
  cantidad: number
}

interface ItemFiado {
  producto: string
  codigo: string
  nombre: string
  cantidad: number
  precioVenta: number
  precioCosto: number
}

interface FiadoGuardado {
  _id: string
  numero: number
  cliente: string
  items: ItemFiado[]
  total: number
  nota: string
  estado: 'pendiente' | 'pagado'
  usuarioCarga?: { nombre: string }
  createdAt: string
  fechaPago?: string
}

export default function FiadosPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [productos, setProductos] = useState<Producto[]>([])
  const [fiados, setFiados] = useState<FiadoGuardado[]>([])
  const [cliente, setCliente] = useState('')
  const [items, setItems] = useState<ItemFiado[]>([])
  const [nota, setNota] = useState('')
  const [buscarProducto, setBuscarProducto] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const [fiadoVer, setFiadoVer] = useState<FiadoGuardado | null>(null)
  const [buscarProductoEdit, setBuscarProductoEdit] = useState('')

  useEffect(() => {
    const fetchDatos = async () => {
      const res = await fetch('/api/productos?limite=1000')
      const json = await res.json()
      if (json.ok) setProductos(json.data)
    }
    fetchDatos()
  }, [])

  useEffect(() => {
    const fetchFiados = async () => {
      const res = await fetch('/api/fiados')
      const json = await res.json()
      if (json.ok) setFiados(json.data)
    }
    fetchFiados()
  }, [refresh])

  const productosFiltrados = buscarProducto.length >= 2
    ? productos.filter(function (p) {
        const texto = (p.nombre + ' ' + (p.codigo || '')).toLowerCase()
        return texto.includes(buscarProducto.toLowerCase())
      }).slice(0, 8)
    : []

  const productosFiltradosEdit = buscarProductoEdit.length >= 2
    ? productos.filter(function (p) {
        const texto = (p.nombre + ' ' + (p.codigo || '')).toLowerCase()
        return texto.includes(buscarProductoEdit.toLowerCase())
      }).slice(0, 8)
    : []

  function agregarDesdeStock(p: Producto) {
    setItems(function (prev) {
      return prev.concat([{
        producto: p._id,
        codigo: p.codigo || '',
        nombre: p.nombre,
        cantidad: 1,
        precioVenta: p.precioVenta,
        precioCosto: p.precioCosto,
      }])
    })
    setBuscarProducto('')
  }

  function cambiarCantidad(index: number, valor: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      copia[index] = Object.assign({}, copia[index], { cantidad: valor })
      return copia
    })
  }

  function cambiarPrecio(index: number, valor: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      copia[index] = Object.assign({}, copia[index], { precioVenta: valor })
      return copia
    })
  }

  function eliminarItem(index: number) {
    setItems(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  const totalActual = items.reduce(function (acc, i) { return acc + i.precioVenta * i.cantidad }, 0)

  async function guardarFiado() {
    if (!cliente.trim()) {
      toast.error('Escribí el nombre del cliente')
      return
    }
    if (items.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    setLoading(true)
    const res = await fetch('/api/fiados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: cliente, items: items, nota: nota }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Fiado registrado correctamente')
      setCliente('')
      setItems([])
      setNota('')
      setRefresh(function (r) { return r + 1 })
    } else {
      toast.error(json.error || 'Error al guardar el fiado')
    }
    setLoading(false)
  }

  async function eliminarFiado(id: string) {
    toast('Seguro que queres eliminar este fiado? El stock descontado se devuelve.', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch('/api/fiados/' + id, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Fiado eliminado, stock restituido')
            setFiados(function (prev) { return prev.filter(function (f) { return f._id !== id } ) })
          } else {
            toast.error(json.error || 'Error al eliminar')
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
    })
  }

  async function marcarPagado(id: string) {
    toast('Confirmás el pago? Se genera la venta correspondiente.', {
      action: {
        label: 'Confirmar pago',
        onClick: async () => {
          const res = await fetch('/api/fiados/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'pagado' }),
          })
          const json = await res.json()
          if (json.ok) {
            toast.success('Fiado pagado y venta generada')
            setRefresh(function (r) { return r + 1 })
          } else {
            toast.error(json.error || 'Error al marcar como pagado')
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
    })
  }

  function abrirVer(f: FiadoGuardado) {
    setFiadoVer(f)
    setBuscarProductoEdit('')
  }

  function cerrarVer() {
    setFiadoVer(null)
  }

  function cambiarCantidadEdicion(index: number, valor: number) {
    if (!fiadoVer) return
    const copia = fiadoVer.items.slice()
    copia[index] = Object.assign({}, copia[index], { cantidad: valor })
    setFiadoVer(Object.assign({}, fiadoVer, { items: copia }))
  }

  function cambiarPrecioEdicion(index: number, valor: number) {
    if (!fiadoVer) return
    const copia = fiadoVer.items.slice()
    copia[index] = Object.assign({}, copia[index], { precioVenta: valor })
    setFiadoVer(Object.assign({}, fiadoVer, { items: copia }))
  }

  function eliminarItemEdicion(index: number) {
    if (!fiadoVer) return
    const copia = fiadoVer.items.filter(function (_, i) { return i !== index })
    setFiadoVer(Object.assign({}, fiadoVer, { items: copia }))
  }

  function agregarDesdeStockEdicion(p: Producto) {
    if (!fiadoVer) return
    const nuevoItem: ItemFiado = {
      producto: p._id,
      codigo: p.codigo || '',
      nombre: p.nombre,
      cantidad: 1,
      precioVenta: p.precioVenta,
      precioCosto: p.precioCosto,
    }
    setFiadoVer(Object.assign({}, fiadoVer, { items: fiadoVer.items.concat([nuevoItem]) }))
    setBuscarProductoEdit('')
  }

  async function guardarEdicion() {
    if (!fiadoVer) return
    setLoading(true)
    const res = await fetch('/api/fiados/' + fiadoVer._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: fiadoVer.items, nota: fiadoVer.nota, cliente: fiadoVer.cliente }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Fiado actualizado')
      setFiadoVer(null)
      setRefresh(function (r) { return r + 1 })
    } else {
      toast.error(json.error || 'Error al actualizar')
    }
    setLoading(false)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Fiados</h1>
        <p className="text-slate-500 text-sm mt-1">Ventas a cuenta - descuenta stock al cargar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={function (e) { setCliente(e.target.value) }}
              placeholder="Nombre del cliente"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar producto en stock
            </label>
            <div className="relative">
              <input
                type="text"
                value={buscarProducto}
                onChange={function (e) { setBuscarProducto(e.target.value) }}
                placeholder="Buscar por nombre o código..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {productosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1">
                  {productosFiltrados.map(function (p) {
                    return (
                      <button
                        key={p._id}
                        onClick={function () { agregarDesdeStock(p) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm border-b last:border-0"
                      >
                        <span className="font-medium text-slate-700">
                          {p.nombre}
                          {p.codigo && <span className="text-slate-400 text-xs ml-2">#{p.codigo}</span>}
                        </span>
                        <span className="text-slate-400">
                          Stock: {p.cantidad} · Venta: {formatPeso(p.precioVenta)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Buscá y agregá productos del stock
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                    <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(function (item, i) {
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.codigo || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{item.nombre}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={function (e) { cambiarCantidad(i, Number(e.target.value)) }}
                            min={1}
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={item.precioVenta}
                              onChange={function (e) { cambiarPrecio(i, Number(e.target.value)) }}
                              className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm"
                            />
                            <span className="text-xs text-slate-400">{formatPeso(item.precioVenta * item.cantidad)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={function () { eliminarItem(i) }}
                            className="text-slate-300 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <h3 className="font-medium text-slate-700">Nota (opcional)</h3>
            <textarea
              value={nota}
              onChange={function (e) { setNota(e.target.value) }}
              rows={4}
              placeholder="Ej: paga a fin de mes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-orange-500">{formatPeso(totalActual)}</span>
            </div>
          </div>

          <button
            onClick={guardarFiado}
            disabled={loading || items.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Guardando...' : 'Registrar fiado'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Fiados registrados</h2>
        </div>
        {fiados.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay fiados cargados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium text-center">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fiados.map(function (f) {
                return (
                  <tr key={f._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">#{f.numero}</td>
                    <td className="px-4 py-3 text-slate-700">{f.cliente}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{f.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatPeso(f.total)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(f.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (f.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={function () { abrirVer(f) }}
                          className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                          title={esAdmin ? 'Ver / editar' : 'Ver'}
                        >
                          <Eye size={15} />
                        </button>
                        {esAdmin && f.estado === 'pendiente' && (
                          <button
                            onClick={function () { marcarPagado(f._id) }}
                            className="text-slate-400 hover:text-green-500 cursor-pointer transition-colors"
                            title="Marcar como pagado"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {esAdmin && f.estado === 'pendiente' && (
                          <button
                            onClick={function () { eliminarFiado(f._id) }}
                            className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {fiadoVer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-slate-800">
                Fiado #{fiadoVer.numero} - {fiadoVer.cliente} ({fiadoVer.estado})
              </h2>
              <button onClick={cerrarVer} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                X
              </button>
            </div>

            <div className="p-5 space-y-4">
              {esAdmin && fiadoVer.estado === 'pendiente' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Buscar producto en stock
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={buscarProductoEdit}
                      onChange={function (e) { setBuscarProductoEdit(e.target.value) }}
                      placeholder="Buscar por nombre o código..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    {productosFiltradosEdit.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 mt-1">
                        {productosFiltradosEdit.map(function (p) {
                          return (
                            <button
                              key={p._id}
                              onClick={function () { agregarDesdeStockEdicion(p) }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0"
                            >
                              <span className="font-medium text-slate-700">{p.nombre}</span>
                              {p.codigo && <span className="text-slate-400 text-xs ml-2">#{p.codigo}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 font-medium">Código</th>
                    <th className="py-2 font-medium">Producto</th>
                    <th className="py-2 font-medium text-center">Cantidad</th>
                    <th className="py-2 font-medium text-right">Precio</th>
                    <th className="py-2 font-medium text-right">Subtotal</th>
                    {esAdmin && fiadoVer.estado === 'pendiente' && <th className="py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {fiadoVer.items.map(function (item, i) {
                    const editable = esAdmin && fiadoVer.estado === 'pendiente'
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 text-slate-500 text-xs">{item.codigo || '-'}</td>
                        <td className="py-2 text-slate-700">{item.nombre}</td>
                        <td className="py-2 text-center">
                          {editable ? (
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={function (e) { cambiarCantidadEdicion(i, Number(e.target.value)) }}
                              min={1}
                              className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                            />
                          ) : (
                            item.cantidad
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {editable ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.precioVenta}
                              onChange={function (e) { cambiarPrecioEdicion(i, Number(e.target.value)) }}
                              className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm"
                            />
                          ) : (
                            formatPeso(item.precioVenta)
                          )}
                        </td>
                        <td className="py-2 text-right font-medium text-slate-700">
                          {formatPeso(item.precioVenta * item.cantidad)}
                        </td>
                        {editable && (
                          <td className="py-2 text-center">
                            <button
                              onClick={function () { eliminarItemEdicion(i) }}
                              className="text-slate-300 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-xl font-bold text-orange-500">
                    {formatPeso(fiadoVer.items.reduce(function (acc, i) { return acc + i.precioVenta * i.cantidad }, 0))}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
                <textarea
                  value={fiadoVer.nota}
                  disabled={!esAdmin || fiadoVer.estado === 'pagado'}
                  onChange={function (e) {
                    setFiadoVer(Object.assign({}, fiadoVer, { nota: e.target.value }))
                  }}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none disabled:bg-slate-50"
                />
              </div>

              {esAdmin && fiadoVer.estado === 'pendiente' && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cerrarVer}
                    className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarEdicion}
                    disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}