'use client'

import { useState, useEffect } from 'react'
import { IProduct, ISupplier } from '@/types'
import { formatPeso } from '@/lib/utils'
import { Trash2, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

interface ItemCompra {
  producto: string
  nombre: string
  cantidad: number
  precioCosto: number
  subtotal: number
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

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, provRes] = await Promise.all([
        fetch('/api/productos?limite=200'),
        fetch('/api/proveedores'),
      ])
      const [prodJson, provJson] = await Promise.all([prodRes.json(), provRes.json()])
      if (prodJson.ok) setProductos(prodJson.data)
      if (provJson.ok) setProveedores(provJson.data)
    }
    fetchData()
  }, [])

  const productosFiltrados = buscar.length >= 2
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(buscar.toLowerCase())
      ).slice(0, 8)
    : []

  function agregarProducto(p: IProduct) {
    const existe = items.find((i) => i.producto === p._id)
    if (existe) {
      setItems((prev) =>
        prev.map((i) =>
          i.producto === p._id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioCosto }
            : i
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          producto: p._id,
          nombre: p.nombre,
          cantidad: 1,
          precioCosto: p.precioCosto,
          subtotal: p.precioCosto,
        },
      ])
    }
    setBuscar('')
  }

  function cambiarCantidad(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.producto === id
            ? { ...i, cantidad: i.cantidad + delta, subtotal: (i.cantidad + delta) * i.precioCosto }
            : i
        )
        .filter((i) => i.cantidad > 0)
    )
  }

  function cambiarPrecio(id: string, precio: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.producto === id
          ? { ...i, precioCosto: precio, subtotal: i.cantidad * precio }
          : i
      )
    )
  }

  function eliminarItem(id: string) {
    setItems((prev) => prev.filter((i) => i.producto !== id))
  }

  const total = items.reduce((acc, i) => acc + i.subtotal, 0)

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
      body: JSON.stringify({ items, proveedor, nota }),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success(`Orden #${json.data.numero} creada correctamente`)
      onGuardado()
    } else {
      toast.error(json.error ?? 'Error al crear la orden')
    }

    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar producto
          </label>
          <div className="relative">
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Escribi el nombre del producto..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {productosFiltrados.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1">
                {productosFiltrados.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => agregarProducto(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm border-b last:border-0"
                  >
                    <span className="font-medium text-slate-700">{p.nombre}</span>
                    <span className="text-slate-400">
                      Costo actual: {formatPeso(p.precioCosto)}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-right">P. Costo</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.producto} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{item.nombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => cambiarCantidad(item.producto, -1)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.producto, 1)}
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
                        onChange={(e) => cambiarPrecio(item.producto, Number(e.target.value))}
                        className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatPeso(item.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => eliminarItem(item.producto)}
                        className="text-slate-300 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
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
              onChange={(e) => setProveedor(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            >
              <option value="">Seleccionar...</option>
              {proveedores.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
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