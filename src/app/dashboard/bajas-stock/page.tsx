'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { formatPeso, formatFechaHora } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface Producto {
  _id: string
  codigo?: string
  nombre: string
  cantidad: number
  precioCosto: number
  unidad: string
}

interface Baja {
  _id: string
  numero: number
  codigo: string
  nombre: string
  cantidad: number
  precioCosto: number
  motivo: string
  nota: string
  createdAt: string
}

const MOTIVOS: Record<string, string> = {
  rotura: 'Rotura',
  uso_interno: 'Uso interno',
  perdida: 'Pérdida / robo',
  otro: 'Otro',
}

const MOTIVO_COLORES: Record<string, string> = {
  rotura: 'bg-red-100 text-red-700',
  uso_interno: 'bg-blue-100 text-blue-700',
  perdida: 'bg-orange-100 text-orange-700',
  otro: 'bg-slate-100 text-slate-600',
}

export default function BajasStockPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [productos, setProductos] = useState<Producto[]>([])
  const [bajas, setBajas] = useState<Baja[]>([])
  const [buscar, setBuscar] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('rotura')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!esAdmin) return
    const fetchProductos = async () => {
      const res = await fetch('/api/productos?limite=1000')
      const json = await res.json()
      if (json.ok) setProductos(json.data)
    }
    fetchProductos()
  }, [esAdmin])

  useEffect(() => {
    if (!esAdmin) return
    const fetchBajas = async () => {
      const res = await fetch('/api/bajas-stock')
      const json = await res.json()
      if (json.ok) setBajas(json.data)
    }
    fetchBajas()
  }, [esAdmin, refresh])

  const productosFiltrados = buscar.length >= 2
    ? productos.filter(function (p) {
        const texto = (p.nombre + ' ' + (p.codigo || '')).toLowerCase()
        return texto.includes(buscar.toLowerCase())
      }).slice(0, 8)
    : []

  function seleccionarProducto(p: Producto) {
    setProductoSeleccionado(p)
    setBuscar('')
    setCantidad(1)
  }

  async function registrarBaja() {
    if (!productoSeleccionado) {
      toast.error('Seleccioná un producto')
      return
    }
    if (cantidad <= 0) {
      toast.error('La cantidad tiene que ser mayor a 0')
      return
    }

    setLoading(true)

    const res = await fetch('/api/bajas-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto: productoSeleccionado._id,
        cantidad: cantidad,
        motivo: motivo,
        nota: nota,
        usuario: session?.user?.nombre || '',
      }),
    })

    const json = await res.json()

    if (json.ok) {
      toast.success('Baja registrada correctamente')
      setProductoSeleccionado(null)
      setCantidad(1)
      setMotivo('rotura')
      setNota('')
      setRefresh(function (r) { return r + 1 })
      setProductos(function (prev) {
        return prev.map(function (p) {
          return p._id === productoSeleccionado._id
            ? Object.assign({}, p, { cantidad: p.cantidad - cantidad })
            : p
        })
      })
    } else {
      toast.error(json.error || 'Error al registrar la baja')
    }

    setLoading(false)
  }
async function eliminarBaja(id: string) {
  toast('Seguro que queres eliminar esta baja? El stock se va a restaurar.', {
    action: {
      label: 'Eliminar',
      onClick: async () => {
        const res = await fetch('/api/bajas-stock/' + id, { method: 'DELETE' })
        const json = await res.json()
        if (json.ok) {
          toast.success('Baja eliminada — stock restaurado')
          setRefresh(function (r) { return r + 1 })
        } else {
          toast.error(json.error || 'Error al eliminar')
        }
      },
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => {},
    },
  })
}
  if (!esAdmin) {
    return (
      <div className="p-6">
        <p className="text-slate-500 text-sm">No tenés permiso para acceder a esta sección.</p>
      </div>
    )
  }

  const totalPerdidoMes = bajas.reduce(function (acc, b) { return acc + b.precioCosto * b.cantidad }, 0)

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bajas de Stock</h1>
        <p className="text-slate-500 text-sm mt-1">Rotura, uso interno o pérdida — no afecta ventas ni facturación</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar producto
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
                        onClick={function () { seleccionarProducto(p) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm border-b last:border-0"
                      >
                        <span className="font-medium text-slate-700">
                          {p.nombre}
                          {p.codigo && <span className="text-slate-400 text-xs ml-2">#{p.codigo}</span>}
                        </span>
                        <span className="text-slate-400">Stock: {p.cantidad} {p.unidad}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {productoSeleccionado && (
              <div className="mt-4 bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{productoSeleccionado.nombre}</p>
                  <p className="text-xs text-slate-400">
                    Stock actual: {productoSeleccionado.cantidad} {productoSeleccionado.unidad} · Costo: {formatPeso(productoSeleccionado.precioCosto)}
                  </p>
                </div>
                <button
                  onClick={function () { setProductoSeleccionado(null) }}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={function (e) { setCantidad(Number(e.target.value)) }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
              <select
                value={motivo}
                onChange={function (e) { setMotivo(e.target.value) }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="rotura">Rotura</option>
                <option value="uso_interno">Uso interno</option>
                <option value="perdida">Pérdida / robo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nota (opcional)</label>
              <textarea
                value={nota}
                onChange={function (e) { setNota(e.target.value) }}
                rows={3}
                placeholder="Detalle adicional..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">Total perdido registrado</p>
            <p className="text-2xl font-bold text-red-500">{formatPeso(totalPerdidoMes)}</p>
            <p className="text-xs text-slate-400 mt-1">{bajas.length} bajas registradas</p>
          </div>

          <button
            onClick={registrarBaja}
            disabled={loading || !productoSeleccionado}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar baja de stock'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Historial de bajas</h2>
        </div>
        {bajas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay bajas registradas</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium text-center">Cantidad</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium text-right">Costo perdido</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
<th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bajas.map(function (b) {
                return (
                  <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-500">#{b.numero}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{b.codigo || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {b.nombre}
                      {b.nota && <p className="text-xs text-slate-400">{b.nota}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{b.cantidad}</td>
                    <td className="px-4 py-3">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + MOTIVO_COLORES[b.motivo]}>
                        {MOTIVOS[b.motivo] || b.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-500">
                      {formatPeso(b.precioCosto * b.cantidad)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
  {formatFechaHora(b.createdAt)}
</td>
<td className="px-4 py-3 text-center">
  <button
    onClick={function () { eliminarBaja(b._id) }}
    className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
    title="Eliminar y restaurar stock"
  >
    <Trash2 size={15} />
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
  )
}