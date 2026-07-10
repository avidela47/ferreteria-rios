'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { Plus, Trash2, FileText } from 'lucide-react'

interface Proveedor {
  _id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
}

interface Producto {
  _id: string
  codigo?: string
  nombre: string
}

interface ItemPedido {
  codigo: string
  descripcion: string
  cantidad: number
  nuevo: boolean
}

export default function PresupuestosPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedorId, setProveedorId] = useState('')
  const [items, setItems] = useState<ItemPedido[]>([])
  const [nota, setNota] = useState('')
  const [buscarProducto, setBuscarProducto] = useState('')
  const [loading, setLoading] = useState(false)

  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)

  useEffect(() => {
    if (!esAdmin) return
    const fetchDatos = async () => {
      const [resProv, resProd] = await Promise.all([
        fetch('/api/proveedores'),
        fetch('/api/productos?limite=1000'),
      ])
      const jsonProv = await resProv.json()
      const jsonProd = await resProd.json()
      if (jsonProv.ok) setProveedores(jsonProv.data)
      if (jsonProd.ok) setProductos(jsonProd.data)
    }
    fetchDatos()
  }, [esAdmin])

  const productosFiltrados = buscarProducto.length >= 2
    ? productos.filter(function (p) {
        const texto = (p.nombre + ' ' + (p.codigo || '')).toLowerCase()
        return texto.includes(buscarProducto.toLowerCase())
      }).slice(0, 8)
    : []

  function agregarDesdeStock(p: Producto) {
    setItems(function (prev) {
      return prev.concat([{
        codigo: p.codigo || '',
        descripcion: p.nombre,
        cantidad: 1,
        nuevo: false,
      }])
    })
    setBuscarProducto('')
  }

  function agregarNuevo() {
    if (!nuevaDescripcion.trim()) {
      toast.error('Escribí una descripción para el producto nuevo')
      return
    }
    setItems(function (prev) {
      return prev.concat([{
        codigo: nuevoCodigo.trim(),
        descripcion: nuevaDescripcion.trim(),
        cantidad: nuevaCantidad,
        nuevo: true,
      }])
    })
    setNuevoCodigo('')
    setNuevaDescripcion('')
    setNuevaCantidad(1)
  }

  function cambiarCantidad(index: number, valor: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      copia[index] = Object.assign({}, copia[index], { cantidad: valor })
      return copia
    })
  }

  function eliminarItem(index: number) {
    setItems(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  async function guardarPedido() {
    if (!proveedorId) {
      toast.error('Seleccioná un proveedor')
      return
    }
    if (items.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    setLoading(true)

    const res = await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedor: proveedorId, items, nota }),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success('Pedido creado correctamente')
      window.open('/imprimir-presupuesto?id=' + json.data._id, '_blank')
      setItems([])
      setNota('')
    } else {
      toast.error(json.error || 'Error al guardar el pedido')
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
        <h1 className="text-2xl font-bold text-slate-800">Solicitar Presupuesto</h1>
        <p className="text-slate-500 text-sm mt-1">Armá un pedido de precios para enviar a tu proveedor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
            <select
              value={proveedorId}
              onChange={function (e) { setProveedorId(e.target.value) }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map(function (p) {
                return <option key={p._id} value={p._id}>{p.nombre}</option>
              })}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agregar producto desde stock
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

          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agregar producto nuevo (no está en el catálogo)
            </label>
            <div className="grid grid-cols-6 gap-2">
              <input
                type="text"
                value={nuevoCodigo}
                onChange={function (e) { setNuevoCodigo(e.target.value) }}
                placeholder="Código (opcional)"
                className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                value={nuevaDescripcion}
                onChange={function (e) { setNuevaDescripcion(e.target.value) }}
                placeholder="Descripción del producto"
                className="col-span-3 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="number"
                value={nuevaCantidad}
                onChange={function (e) { setNuevaCantidad(Number(e.target.value)) }}
                min={1}
                className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={agregarNuevo}
                className="col-span-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Agregá productos desde el stock o cargá productos nuevos
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(function (item, i) {
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.codigo || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.descripcion}
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
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                          />
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
              placeholder="Ej: Necesito precio con IVA incluido..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <button
            onClick={guardarPedido}
            disabled={loading || items.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            {loading ? 'Guardando...' : 'Generar pedido de presupuesto'}
          </button>
        </div>
      </div>
    </div>
  )
}