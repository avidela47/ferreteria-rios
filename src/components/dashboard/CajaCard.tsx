'use client'

import { useState, useEffect } from 'react'
import { formatPeso } from '@/lib/utils'
import { toast } from 'sonner'
import { Wallet, Lock, Unlock } from 'lucide-react'

interface CajaData {
  _id: string
  montoInicial: number
  usuarioApertura: string
  horaApertura: string
  estado: string
  efectivoEsperado: number
  efectivoVentas: number
  otrosVentas: number
  otrosDetalle: Record<string, number>
}

export default function CajaCard() {
  const [caja, setCaja] = useState<CajaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [montoInicial, setMontoInicial] = useState('')
  const [abriendo, setAbriendo] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [mostrarCierre, setMostrarCierre] = useState(false)

  useEffect(() => {
    fetchCaja()
  }, [])

  async function fetchCaja() {
    setLoading(true)
    const res = await fetch('/api/caja')
    const json = await res.json()
    if (json.ok) setCaja(json.data)
    setLoading(false)
  }

  async function abrirCaja() {
    if (!montoInicial || Number(montoInicial) < 0) {
      toast.error('Ingresá un monto inicial válido')
      return
    }
    setAbriendo(true)
    const res = await fetch('/api/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montoInicial: Number(montoInicial) }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Caja abierta correctamente')
      setMontoInicial('')
      fetchCaja()
    } else {
      toast.error(json.error || 'Error al abrir la caja')
    }
    setAbriendo(false)
  }

  async function cerrarCaja() {
    if (!caja) return
    setCerrando(true)
    const res = await fetch('/api/caja/' + caja._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Caja cerrada correctamente')
      setMostrarCierre(false)
      fetchCaja()
    } else {
      toast.error(json.error || 'Error al cerrar la caja')
    }
    setCerrando(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-5">
        <p className="text-sm text-slate-400">Cargando caja...</p>
      </div>
    )
  }

  if (!caja) {
    return (
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-slate-100 text-slate-500 p-1.5 rounded-xl">
            <Unlock size={16} />
          </div>
          <h2 className="font-bold text-blue-500">Caja cerrada</h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">Ingresá el efectivo inicial para abrir la caja de hoy</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={montoInicial}
            onChange={function (e) { setMontoInicial(e.target.value) }}
            placeholder="Ej: 20000"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={abrirCaja}
            disabled={abriendo}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            {abriendo ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 border-2 border-emerald-400">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-xl">
            <Wallet size={16} />
          </div>
          <h2 className="font-bold text-blue-500">Caja abierta</h2>
        </div>
        <span className="text-xs text-slate-400">Inició: {caja.usuarioApertura}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-400">Caja inicial</p>
          <p className="text-base font-bold text-blue-500">{formatPeso(caja.montoInicial)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Ventas efectivo hoy</p>
          <p className="text-base font-bold text-blue-500">{formatPeso(caja.efectivoVentas)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Efectivo esperado en caja</p>
          <p className="text-lg font-bold text-emerald-600">{formatPeso(caja.efectivoEsperado)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Otros medios (tarjeta/transf./posnet)</p>
          <p className="text-lg font-bold text-blue-500">{formatPeso(caja.otrosVentas)}</p>
        </div>
      </div>

      {!mostrarCierre ? (
        <button
          onClick={function () { setMostrarCierre(true) }}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 text-blue-500 hover:bg-slate-50 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
        >
          <Lock size={15} /> Cerrar caja
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-orange-600 font-medium">
            Confirmás el cierre de caja de hoy? Efectivo final: {formatPeso(caja.efectivoEsperado)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={function () { setMostrarCierre(false) }}
              className="flex-1 border border-slate-200 text-blue-500 py-2 rounded-xl text-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={cerrarCaja}
              disabled={cerrando}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}