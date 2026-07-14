'use client'

import { useState, useEffect } from 'react'
import { IProduct, ISupplier } from '@/types'
import { formatPeso } from '@/lib/utils'
import { Trash2, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

interface ItemCompra {
  producto: string | null
  codigo: string
  nombre: string
  cantidad: number
  precioCosto: number
  subtotal: number
  nuevo: boolean
}

interface Props {
  onGuardado: () => void
}

export default function NuevaCompra({ onGuardado }: Props) {
  const [productos, setProductos] = useState<IProduct[]>([])
  const [proveedores, setProveedores] = useState<ISupplier[]>([])
  const [items, setItems] = useState<ItemCompra[]>([])
  const [buscar, setBuscar] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)

  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoCosto, setNuevoCosto] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, provRes] = await Promise.all([
        fetch('/api/productos?limite=1000'),
        fetch('/api/proveedores'),
      ])
      const [prodJson, provJson] = await Promise.all([prodRes.json(), provRes.json()])
      if (prodJson.ok) setProductos(prodJson.data)
      if (provJson.ok) setProveedores(provJson.data)
    }
    fetchData()
  }, [])

  const productosFiltrados = buscar.length >= 2
    ? productos.filter(function (p) {
        const texto = (p.nombre + ' ' + (p.codigo || '')).toLowerCase()
        return texto.includes(buscar.toLowerCase())
      }).slice(0, 8)
    : []

  function agregarProducto(p: IProduct) {
    const existe = items.find(function (i) { return i.producto === p._id })
    if (existe) {
      setItems(function (prev) {
        return prev.map(function (i) {
          return i.producto === p._id
            ? Object.assign({}, i, { cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioCosto })
            : i
        })
      })
    } else {
      setItems(function (prev) {
        return prev.concat([{
          producto: p._id,
          codigo: p.codigo || '',
          nombre: p.nombre,
          cantidad: 1,
          precioCosto: p.precioCosto,
          subtotal: p.precioCosto,
          nuevo: false,
        }])
      })
    }
    setBuscar('')
  }

  function agregarNuevo() {
    if (!nuevoNombre.trim()) {
      toast.error('Escribí un nombre para el producto nuevo')
      return
    }
    setItems(function (prev) {
      return prev.concat([{
        producto: null,
        codigo: nuevoCodigo.trim(),
        nombre: nuevoNombre.trim(),
        cantidad: nuevaCantidad,
        precioCosto: nuevoCosto,
        subtotal: nuevaCantidad * nuevoCosto,
        nuevo: true,
      }])
    })
    setNuevoCodigo('')
    setNuevoNombre('')
    setNuevaCantidad(1)
    setNuevoCosto(0)
  }

  function cambiarCantidad(index: number, delta: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      const nuevaCant = copia[index].cantidad + delta
      if (nuevaCant <= 0) return copia
      copia[index] = Object.assign({}, copia[index], {
        cantidad: nuevaCant,
        subtotal: nuevaCant * copia[index].precioCosto,
      })
      return copia
    })
  }

  function cambiarPrecio(index: number, precio: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      copia[index] = Object.assign({}, copia[index], {
        precioCosto: precio,
        subtotal: copia[index].cantidad * precio,
      })
      return copia
    })
  }

  function eliminarItem(index: number) {
    setItems(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  const total = items.reduce(function (acc, i) { return acc + i.subtotal }, 0)

  async function handleGuardar() {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    if (!proveedor) {
      toast.error('Selecciona un proveedor')
      return
    }
    setLoading(true)

    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items, proveedor: proveedor, nota: nota }),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success('Orden #' + json.data.numero + ' creada correctamente')
      onGuardado()
    } else {
      toast.error(json.error || 'Error al crear la orden')
    }

    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Agregar producto desde stock
          </label>
          <div className="relative">
            <input
              type="text"
              value={buscar}
              onChange={function (e) { setBuscar(e.target.value) }}
              placeholder="Buscar por nombre o código..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {productosFiltrados.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1">
                {productosFiltrados.map(function (p) {
                  return (
                    <button
                      key={p._id}
                      onClick={function () { agregarProducto(p) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm border-b last:border-0"
                    >
                      <span className="font-medium text-slate-700">
                        {p.nombre}
                        {p.codigo && <span className="text-slate-400 text-xs ml-2">#{p.codigo}</span>}
                      </span>
                      <span className="text-slate-400">
                        Costo actual: {formatPeso(p.precioCosto)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Agregar producto nuevo (no está en stock)
          </label>
          <div className="grid grid-cols-6 gap-2">
            <input
              type="text"
              value={nuevoCodigo}
              onChange={function (e) { setNuevoCodigo(e.target.value) }}
              placeholder="Código"
              className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              value={nuevoNombre}
              onChange={function (e) { setNuevoNombre(e.target.value) }}
              placeholder="Nombre del producto"
              className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="number"
              value={nuevaCantidad}
              onChange={function (e) { setNuevaCantidad(Number(e.target.value)) }}
              min={1}
              placeholder="Cant."
              className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="number"
              step="0.01"
              value={nuevoCosto}
              onChange={function (e) { setNuevoCosto(Number(e.target.value)) }}
              placeholder="Costo"
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
              Busca y agrega productos a la orden
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-right">P. Costo</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(function (item, i) {
                  return (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs">{item.codigo || '-'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.nombre}
                        {item.nuevo && (
                          <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                            nuevo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={function () { cambiarCantidad(i, -1) }}
                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.cantidad}</span>
                          <button
                            onClick={function () { cambiarCantidad(i, 1) }}
                            className="text-slate-400 hover:text-green-500 cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.precioCosto}
                          onChange={function (e) { cambiarPrecio(i, Number(e.target.value)) }}
                          className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatPeso(item.subtotal)}
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
          <h3 className="font-medium text-slate-700">Datos de la orden</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Proveedor *
            </label>
            <select
              value={proveedor}
              onChange={function (e) { setProveedor(e.target.value) }}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            >
              <option value="">Seleccionar...</option>
              {proveedores.map(function (p) {
                return <option key={p._id} value={p._id}>{p.nombre}</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
            <input
              value={nota}
              onChange={function (e) { setNota(e.target.value) }}
              placeholder="Opcional..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between text-base font-bold">
            <span>Total orden</span>
            <span className="text-orange-500">{formatPeso(total)}</span>
          </div>
        </div>

        <button
          onClick={handleGuardar}
          disabled={loading || items.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Crear orden de compra'}
        </button>
      </div>
    </div>
  )
}