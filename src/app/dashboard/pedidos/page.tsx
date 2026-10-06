'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { Plus, Trash2, FileText, Eye, Printer, CheckCircle } from 'lucide-react'
import { formatPeso } from '@/lib/utils'

interface Producto {
  _id: string
  codigo?: string
  nombre: string
  precioCosto: number
  cantidad: number
}

interface ItemPedido {
  codigo: string
  nombre: string
  cantidad: number
  precioCosto: number
  nuevo: boolean
}

interface PedidoGuardado {
  _id: string
  numero: number
  items: ItemPedido[]
  nota: string
  estado: 'borrador' | 'confirmado'
  createdAt: string
}

export default function PedidosPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [productos, setProductos] = useState<Producto[]>([])
  const [pedidos, setPedidos] = useState<PedidoGuardado[]>([])
  const [items, setItems] = useState<ItemPedido[]>([])
  const [nota, setNota] = useState('')
  const [buscarProducto, setBuscarProducto] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoCosto, setNuevoCosto] = useState(0)

  const [pedidoEditar, setPedidoEditar] = useState<PedidoGuardado | null>(null)
  const [buscarProductoEdit, setBuscarProductoEdit] = useState('')
  const [nuevoCodigoEdit, setNuevoCodigoEdit] = useState('')
  const [nuevoNombreEdit, setNuevoNombreEdit] = useState('')
  const [nuevaCantidadEdit, setNuevaCantidadEdit] = useState(1)
  const [nuevoCostoEdit, setNuevoCostoEdit] = useState(0)

  useEffect(() => {
    if (!esAdmin) return
    const fetchDatos = async () => {
      const res = await fetch('/api/productos?limite=1000')
      const json = await res.json()
      if (json.ok) setProductos(json.data)
    }
    fetchDatos()
  }, [esAdmin])

  useEffect(() => {
    if (!esAdmin) return
    const fetchPedidos = async () => {
      const res = await fetch('/api/pedidos')
      const json = await res.json()
      if (json.ok) setPedidos(json.data)
    }
    fetchPedidos()
  }, [esAdmin, refresh])

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
        codigo: p.codigo || '',
        nombre: p.nombre,
        cantidad: 1,
        precioCosto: p.precioCosto,
        nuevo: false,
      }])
    })
    setBuscarProducto('')
  }

  function agregarNuevo() {
    if (!nuevoNombre.trim()) {
      toast.error('Escribí un nombre para el producto nuevo')
      return
    }
    setItems(function (prev) {
      return prev.concat([{
        codigo: nuevoCodigo.trim(),
        nombre: nuevoNombre.trim(),
        cantidad: nuevaCantidad,
        precioCosto: nuevoCosto,
        nuevo: true,
      }])
    })
    setNuevoCodigo('')
    setNuevoNombre('')
    setNuevaCantidad(1)
    setNuevoCosto(0)
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
      copia[index] = Object.assign({}, copia[index], { precioCosto: valor })
      return copia
    })
  }

  function eliminarItem(index: number) {
    setItems(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  const totalEstimado = items.reduce(function (acc, i) { return acc + i.precioCosto * i.cantidad }, 0)

  async function guardarPedido() {
    if (items.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    setLoading(true)

    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items, nota: nota }),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success('Pedido creado correctamente')
      setItems([])
      setNota('')
      setRefresh(function (r) { return r + 1 })
    } else {
      toast.error(json.error || 'Error al guardar el pedido')
    }

    setLoading(false)
  }

  async function eliminarPedido(id: string) {
    toast('Seguro que queres eliminar este pedido?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch('/api/pedidos/' + id, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Pedido eliminado')
            setPedidos(function (prev) {
              return prev.filter(function (p) { return p._id !== id })
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

  async function confirmarPedido(id: string) {
    const res = await fetch('/api/pedidos/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'confirmado' }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Pedido confirmado')
      setRefresh(function (r) { return r + 1 })
    } else {
      toast.error(json.error || 'Error al confirmar')
    }
  }

  function abrirEdicion(p: PedidoGuardado) {
    setPedidoEditar(p)
    setBuscarProductoEdit('')
    setNuevoCodigoEdit('')
    setNuevoNombreEdit('')
    setNuevaCantidadEdit(1)
    setNuevoCostoEdit(0)
  }

  function cerrarEdicion() {
    setPedidoEditar(null)
  }

  function cambiarCantidadEdicion(index: number, valor: number) {
    if (!pedidoEditar) return
    const copia = pedidoEditar.items.slice()
    copia[index] = Object.assign({}, copia[index], { cantidad: valor })
    setPedidoEditar(Object.assign({}, pedidoEditar, { items: copia }))
  }

  function cambiarPrecioEdicion(index: number, valor: number) {
    if (!pedidoEditar) return
    const copia = pedidoEditar.items.slice()
    copia[index] = Object.assign({}, copia[index], { precioCosto: valor })
    setPedidoEditar(Object.assign({}, pedidoEditar, { items: copia }))
  }

  function eliminarItemEdicion(index: number) {
    if (!pedidoEditar) return
    const copia = pedidoEditar.items.filter(function (_, i) { return i !== index })
    setPedidoEditar(Object.assign({}, pedidoEditar, { items: copia }))
  }

  function agregarDesdeStockEdicion(p: Producto) {
    if (!pedidoEditar) return
    const nuevoItem = {
      codigo: p.codigo || '',
      nombre: p.nombre,
      cantidad: 1,
      precioCosto: p.precioCosto,
      nuevo: false,
    }
    const copia = pedidoEditar.items.concat([nuevoItem])
    setPedidoEditar(Object.assign({}, pedidoEditar, { items: copia }))
    setBuscarProductoEdit('')
  }

  function agregarNuevoEdicion() {
    if (!pedidoEditar) return
    if (!nuevoNombreEdit.trim()) {
      toast.error('Escribí un nombre para el producto nuevo')
      return
    }
    const nuevoItem = {
      codigo: nuevoCodigoEdit.trim(),
      nombre: nuevoNombreEdit.trim(),
      cantidad: nuevaCantidadEdit,
      precioCosto: nuevoCostoEdit,
      nuevo: true,
    }
    const copia = pedidoEditar.items.concat([nuevoItem])
    setPedidoEditar(Object.assign({}, pedidoEditar, { items: copia }))
    setNuevoCodigoEdit('')
    setNuevoNombreEdit('')
    setNuevaCantidadEdit(1)
    setNuevoCostoEdit(0)
  }

  async function guardarEdicion() {
    if (!pedidoEditar) return
    setLoading(true)
    const res = await fetch('/api/pedidos/' + pedidoEditar._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: pedidoEditar.items, nota: pedidoEditar.nota }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Pedido actualizado')
      setPedidoEditar(null)
      setRefresh(function (r) { return r + 1 })
    } else {
      toast.error(json.error || 'Error al actualizar')
    }
    setLoading(false)
  }

  if (!esAdmin) {
    return (
      <div className="p-6">
        <p className="text-slate-500 text-sm">No tenés permiso para acceder a esta sección.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Pedidos</h1>
        <p className="text-slate-500 text-sm mt-1">Lista de productos que necesitás comprar - no afecta el stock</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agregar producto desde stock
            </label>
            <div className="relative">
              <input
                type="text"
                value={buscarProducto}
                onChange={function (e) { setBuscarProducto(e.target.value) }}
                placeholder="Buscar por nombre o código..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {productosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 mt-1">
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
                          Stock: {p.cantidad} · Costo: {formatPeso(p.precioCosto)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agregar producto nuevo (no está en stock)
            </label>
            <div className="grid grid-cols-6 gap-2">
              <input
                type="text"
                value={nuevoCodigo}
                onChange={function (e) { setNuevoCodigo(e.target.value) }}
                placeholder="Código"
                className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                value={nuevoNombre}
                onChange={function (e) { setNuevoNombre(e.target.value) }}
                placeholder="Nombre del producto"
                className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="number"
                value={nuevaCantidad}
                onChange={function (e) { setNuevaCantidad(Number(e.target.value)) }}
                min={1}
                placeholder="Cant."
                className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="number"
                step="0.01"
                value={nuevoCosto}
                onChange={function (e) { setNuevoCosto(Number(e.target.value)) }}
                placeholder="Costo est."
                className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={agregarNuevo}
                className="col-span-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Agregá productos desde el stock o cargá productos nuevos
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                    <th className="px-4 py-3 font-medium text-right">Subtotal est.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(function (item, i) {
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.codigo || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.nombre}
                          {item.nuevo && (
                            <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                              nuevo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={function (e) { cambiarCantidad(i, Number(e.target.value)) }}
                            min={1}
                            className="w-16 border border-slate-200 rounded-xl px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
  <div className="flex flex-col items-end gap-1">
    <input
      type="number"
      step="0.01"
      value={item.precioCosto}
      onChange={function (e) { cambiarPrecio(i, Number(e.target.value)) }}
      className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm"
    />
    <span className="text-xs text-slate-400">{formatPeso(item.precioCosto * item.cantidad)}</span>
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
          <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 space-y-3">
            <h3 className="font-medium text-slate-700">Nota (opcional)</h3>
            <textarea
              value={nota}
              onChange={function (e) { setNota(e.target.value) }}
              rows={4}
              placeholder="Ej: cliente pidio esto la semana pasada..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
            <div className="flex justify-between text-base font-bold">
              <span>Total estimado</span>
              <span className="text-orange-500">{formatPeso(totalEstimado)}</span>
            </div>
          </div>

          <button
            onClick={guardarPedido}
            disabled={loading || items.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            {loading ? 'Guardando...' : 'Guardar pedido'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Pedidos guardados</h2>
        </div>
        {pedidos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay pedidos guardados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium text-center">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total estimado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(function (p) {
                const total = p.items.reduce(function (acc, i) { return acc + i.precioCosto * i.cantidad }, 0)
                return (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">#{p.numero}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-500">{formatPeso(total)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (p.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={function () { abrirEdicion(p) }}
                          className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                          title="Ver / editar"
                        >
                          <Eye size={15} />
                        </button>
                        {p.estado === 'borrador' && (
                          <button
                            onClick={function () { confirmarPedido(p._id) }}
                            className="text-slate-400 hover:text-green-500 cursor-pointer transition-colors"
                            title="Confirmar pedido"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {p.estado === 'confirmado' && (
                          
                           <a href={'/imprimir-pedido?id=' + p._id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                            title="Imprimir"
                          >
                            <Printer size={15} />
                          </a>
                        )}
                        <button
                          onClick={function () { eliminarPedido(p._id) }}
                          className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {pedidoEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-blue-500">
                Pedido #{pedidoEditar.numero} ({pedidoEditar.estado})
              </h2>
              <button onClick={cerrarEdicion} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                X
              </button>
            </div>

            <div className="p-5 space-y-4">
              {pedidoEditar.estado === 'borrador' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Agregar producto desde stock
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={buscarProductoEdit}
                        onChange={function (e) { setBuscarProductoEdit(e.target.value) }}
                        placeholder="Buscar por nombre o código..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      {productosFiltradosEdit.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1">
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

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Agregar producto nuevo
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      <input
                        type="text"
                        value={nuevoCodigoEdit}
                        onChange={function (e) { setNuevoCodigoEdit(e.target.value) }}
                        placeholder="Código"
                        className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="text"
                        value={nuevoNombreEdit}
                        onChange={function (e) { setNuevoNombreEdit(e.target.value) }}
                        placeholder="Nombre"
                        className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="number"
                        value={nuevaCantidadEdit}
                        onChange={function (e) { setNuevaCantidadEdit(Number(e.target.value)) }}
                        min={1}
                        className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={nuevoCostoEdit}
                        onChange={function (e) { setNuevoCostoEdit(Number(e.target.value)) }}
                        placeholder="Costo"
                        className="col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <button
                        onClick={agregarNuevoEdicion}
                        className="col-span-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100 border-slate-100">
                    <th className="py-2 font-medium">Código</th>
                    <th className="py-2 font-medium">Producto</th>
                    <th className="py-2 font-medium text-center">Cantidad</th>
                    <th className="py-2 font-medium text-right">Costo est.</th>
                    {pedidoEditar.estado === 'borrador' && <th className="py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {pedidoEditar.items.map(function (item, i) {
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 text-slate-500 text-xs">{item.codigo || '-'}</td>
                        <td className="py-2 text-slate-700">
                          {item.nombre}
                          {item.nuevo && (
                            <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                              nuevo
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          {pedidoEditar.estado === 'borrador' ? (
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={function (e) { cambiarCantidadEdicion(i, Number(e.target.value)) }}
                              min={1}
                              className="w-16 border border-slate-200 rounded-xl px-2 py-1 text-sm text-center"
                            />
                          ) : (
                            item.cantidad
                          )}
                        </td>
                        <td className="py-2 text-right">
  {pedidoEditar.estado === 'borrador' ? (
    <input
      type="number"
      step="0.01"
      value={item.precioCosto}
      onChange={function (e) { cambiarPrecioEdicion(i, Number(e.target.value)) }}
      className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm"
    />
  ) : (
    formatPeso(item.precioCosto)
  )}
</td>
<td className="py-2 text-right font-medium text-slate-700">
  {formatPeso(item.precioCosto * item.cantidad)}
</td>
                        {pedidoEditar.estado === 'borrador' && (
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
    <p className="text-sm text-slate-500">Total estimado</p>
    <p className="text-xl font-bold text-orange-500">
      {formatPeso(pedidoEditar.items.reduce(function (acc, i) { return acc + i.precioCosto * i.cantidad }, 0))}
    </p>
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
  <textarea
    value={pedidoEditar.nota}
                  disabled={pedidoEditar.estado === 'confirmado'}
                  onChange={function (e) {
                    setPedidoEditar(Object.assign({}, pedidoEditar, { nota: e.target.value }))
                  }}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none disabled:bg-slate-50"
                />
              </div>

              {pedidoEditar.estado === 'borrador' && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cerrarEdicion}
                    className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarEdicion}
                    disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
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