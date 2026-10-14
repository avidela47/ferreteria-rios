'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatPeso } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface VentaItem {
  producto: string | { _id: string }
  nombre: string
  cantidad: number
  subtotal: number
}

interface Venta {
  _id: string
  total: number
  items: VentaItem[]
}

interface Producto {
  _id: string
  codigo?: string
  nombre: string
  cantidad: number
  stockMinimo: number
  unidad: string
}

interface Fila {
  id: string
  nombre: string
  codigo: string
  unidad: string
  vendido: number
  total: number
  precio: number
  stock: number | null
  reponer: boolean
}

function fechaALocalString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + dia
}

function partesFecha(fecha: string) {
  const p = fecha.split('-').map(Number)
  return { y: p[0], m: p[1], d: p[2] }
}

function idDeItem(p: VentaItem['producto'] | null | undefined): string {
  if (!p) return ''
  return typeof p === 'string' ? p : p._id
}

function fmtCant(n: number): string {
  return String(Math.round(n * 100) / 100)
}

export default function VentasDiaPage() {
  const [fecha, setFecha] = useState('')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soloReponer, setSoloReponer] = useState(false)

  // La fecha se fija en el cliente para no desfasar el día entre servidor y navegador
  useEffect(() => {
    setFecha(fechaALocalString(new Date()))
  }, [])

  useEffect(() => {
    if (!fecha) return
    let cancelado = false

    const cargar = async () => {
      setLoading(true)
      setError('')
      const { y, m, d } = partesFecha(fecha)
      const desde = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
      const hasta = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()

      try {
        const [resVentas, resProductos] = await Promise.all([
          fetch(
            '/api/ventas?estado=completada&limite=1000&desde=' +
              encodeURIComponent(desde) +
              '&hasta=' +
              encodeURIComponent(hasta)
          ),
          fetch('/api/productos?limite=1000'),
        ])
        const jsonVentas = await resVentas.json()
        const jsonProductos = await resProductos.json()
        if (cancelado) return

        if (!jsonVentas.ok || !jsonProductos.ok) {
          setError('No se pudieron cargar los datos')
          setVentas([])
          setProductos([])
        } else {
          setVentas(jsonVentas.data)
          setProductos(jsonProductos.data)
        }
      } catch {
        if (!cancelado) {
          setError('No se pudieron cargar los datos')
          setVentas([])
          setProductos([])
        }
      }
      if (!cancelado) setLoading(false)
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [fecha])

  const filas = useMemo(function () {
    const productoPorId = new Map<string, Producto>()
    productos.forEach(function (p) {
      productoPorId.set(p._id, p)
    })

    const acumulado = new Map<string, Fila>()
    ventas.forEach(function (v) {
      v.items.forEach(function (it) {
        const id = idDeItem(it.producto)
        if (!id) return
        let fila = acumulado.get(id)
        if (!fila) {
          const prod = productoPorId.get(id)
          fila = {
            id: id,
            nombre: prod ? prod.nombre : it.nombre,
            codigo: prod && prod.codigo ? prod.codigo : '',
            unidad: prod ? prod.unidad : '',
            vendido: 0,
            total: 0,
            precio: 0,
            stock: prod ? prod.cantidad : null,
            reponer: prod ? prod.cantidad <= prod.stockMinimo : false,
          }
          acumulado.set(id, fila)
        }
        fila.vendido += it.cantidad
        fila.total += it.subtotal
      })
    })

    const lista = Array.from(acumulado.values())
    lista.forEach(function (f) {
      f.precio = f.vendido > 0 ? f.total / f.vendido : 0
    })
    lista.sort(function (a, b) {
      if (b.vendido !== a.vendido) return b.vendido - a.vendido
      return a.nombre.localeCompare(b.nombre)
    })
    return lista
  }, [ventas, productos])

  const filasVisibles = soloReponer
    ? filas.filter(function (f) { return f.reponer })
    : filas

  const totalDia = ventas.reduce(function (acc, v) { return acc + v.total }, 0)
  const unidadesVendidas = filas.reduce(function (acc, f) { return acc + f.vendido }, 0)
  const cantidadAReponer = filas.filter(function (f) { return f.reponer }).length

  const hoy = fechaALocalString(new Date())

  function moverDia(delta: number) {
    if (!fecha) return
    const { y, m, d } = partesFecha(fecha)
    setFecha(fechaALocalString(new Date(y, m - 1, d + delta)))
  }

  let etiquetaFecha = ''
  if (fecha) {
    const { y, m, d } = partesFecha(fecha)
    etiquetaFecha = new Date(y, m - 1, d).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Ventas del día</h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">{etiquetaFecha || 'Cargando fecha...'}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={function () { moverDia(-1) }}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          title="Día anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={fecha}
          max={hoy}
          onChange={function (e) {
            if (e.target.value) setFecha(e.target.value)
          }}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={function () { moverDia(1) }}
          disabled={!fecha || fecha >= hoy}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          title="Día siguiente"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={function () { setFecha(hoy) }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Hoy
        </button>

        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloReponer}
            onChange={function (e) { setSoloReponer(e.target.checked) }}
            className="w-4 h-4 accent-orange-500"
          />
          Solo a reponer
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Ventas</p>
          <p className="text-2xl font-bold text-blue-500">{ventas.length}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Total vendido</p>
          <p className="text-2xl font-bold text-orange-500">{formatPeso(totalDia)}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Unidades vendidas</p>
          <p className="text-2xl font-bold text-blue-500">{fmtCant(unidadesVendidas)}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">A reponer</p>
          <p className={'text-2xl font-bold ' + (cantidadAReponer > 0 ? 'text-red-500' : 'text-blue-500')}>
            {cantidadAReponer}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : filasVisibles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {soloReponer ? 'Ningún producto vendido este día quedó para reponer' : 'No hay ventas en este día'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold text-right">Vendido</th>
                <th className="px-4 py-3 font-semibold text-right">Precio</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Stock actual</th>
              </tr>
            </thead>
            <tbody>
              {filasVisibles.map(function (f) {
                return (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{f.nombre}</span>
                      {f.codigo && <span className="text-slate-400 text-xs ml-2">#{f.codigo}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-500">
                      {fmtCant(f.vendido)} {f.unidad}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatPeso(f.precio)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-500">{formatPeso(f.total)}</td>
                    <td className="px-4 py-3 text-right">
                      {f.stock === null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 justify-end">
                          {f.reponer && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                              Reponer
                            </span>
                          )}
                          <span className={f.reponer ? 'font-semibold text-red-500' : 'text-slate-700'}>
                            {fmtCant(f.stock)} {f.unidad}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        El stock que se muestra es el actual, no el de ese día. Los fiados se cuentan el día en que se marcan como pagados.
      </p>
    </div>
  )
}