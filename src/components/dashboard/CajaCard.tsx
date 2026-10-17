'use client'

import { useState, useEffect } from 'react'
import { formatPeso } from '@/lib/utils'
import { toast } from 'sonner'
import { Wallet, Lock, Unlock } from 'lucide-react'

// Antes de las 16:30 (hora Argentina) sale la siesta; desde las 16:30 sale la noche
const HORA_CORTE_SIESTA = 16.5

function horaArgentina(fecha: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(fecha)
  let h = 0
  let m = 0
  for (const p of partes) {
    if (p.type === 'hour') h = Number(p.value)
    if (p.type === 'minute') m = Number(p.value)
  }
  return h + m / 60
}

function reproducir(v: HTMLVideoElement | null) {
  if (!v) return
  v.play().catch(function () {
    // si el navegador bloquea el sonido, se reproduce sin audio
    v.muted = true
    v.play().catch(function () {})
  })
}

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
  const [montoSugerido, setMontoSugerido] = useState<number | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [contado, setContado] = useState('')
  const [retiro, setRetiro] = useState('')
  const [nota, setNota] = useState('')
  const [despedida, setDespedida] = useState<'apertura' | 'siesta' | 'noche' | null>(null)

  useEffect(() => {
    fetchCaja()
  }, [])

  async function fetchCaja() {
    setLoading(true)
    const res = await fetch('/api/caja')
    const json = await res.json()
    if (json.ok) {
      setCaja(json.data)
      if (!json.data && json.montoSugerido !== null && json.montoSugerido !== undefined) {
        setMontoSugerido(json.montoSugerido)
        setMontoInicial(String(json.montoSugerido))
      } else {
        setMontoSugerido(null)
      }
    }
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
      setDespedida('apertura')
      setMontoInicial('')
      fetchCaja()
    } else {
      toast.error(json.error || 'Error al abrir la caja')
    }
    setAbriendo(false)
  }

  function abrirCierre() {
    if (!caja) return
    setContado(String(Math.round(caja.efectivoEsperado * 100) / 100))
    setRetiro('')
    setNota('')
    setMostrarCierre(true)
  }

  async function cerrarCaja() {
    if (!caja) return
    setCerrando(true)
    const res = await fetch('/api/caja/' + caja._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        efectivoContado: Number(contado),
        retiro: Number(retiro === '' ? 0 : retiro),
        nota: nota,
      }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Caja cerrada correctamente')
      setMostrarCierre(false)
      const cierre = json.data && json.data.horaCierre ? new Date(json.data.horaCierre) : new Date()
      setDespedida(horaArgentina(cierre) < HORA_CORTE_SIESTA ? 'siesta' : 'noche')
      fetchCaja()
    } else {
      toast.error(json.error || 'Error al cerrar la caja')
    }
    setCerrando(false)
  }

  const banner = despedida ? (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={function () { setDespedida(null) }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-4 text-center"
        onClick={function (e) { e.stopPropagation() }}
      >
        <video
          key={despedida}
          ref={reproducir}
          src={
            despedida === 'apertura'
              ? '/tito-bulon-buena-jornada.mp4'
              : despedida === 'siesta'
                ? '/tito-bulon-siesta-1630.mp4'
                : '/tito-bulon-que-descanses.mp4'
          }
          autoPlay
          playsInline
          onEnded={function () { setDespedida(null) }}
          className="w-full max-h-[70vh] rounded-2xl bg-black"
        />
        <button
          onClick={function () { setDespedida(null) }}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
        >
          Listo
        </button>
      </div>
    </div>
  ) : null

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-sm text-slate-400">Cargando caja...</p>
        </div>
        {banner}
      </>
    )
  }

  if (!caja) {
    return (
      <>
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-slate-100 text-slate-500 p-1.5 rounded-xl">
              <Unlock size={16} />
            </div>
            <h2 className="font-bold text-blue-500">Caja cerrada</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            {montoSugerido !== null
              ? 'Sugerido: ' + formatPeso(montoSugerido) + ' (lo que quedó al cerrar la última caja). Podés editarlo.'
              : 'Ingresá el efectivo inicial para abrir la caja de hoy'}
          </p>
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
        {banner}
      </>
    )
  }

  const contadoNum = Number(contado)
  const retiroNum = Number(retiro === '' ? 0 : retiro)
  const retiroMayor = contado !== '' && retiroNum > contadoNum
  const valido =
    contado !== '' &&
    Number.isFinite(contadoNum) &&
    contadoNum >= 0 &&
    Number.isFinite(retiroNum) &&
    retiroNum >= 0 &&
    retiroNum <= contadoNum
  const dif = valido ? Math.round((contadoNum - caja.efectivoEsperado) * 100) / 100 : 0
  const queda = valido ? Math.round((contadoNum - retiroNum) * 100) / 100 : 0

  return (
    <>
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
            onClick={abrirCierre}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-blue-500 hover:bg-slate-50 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            <Lock size={15} /> Cerrar caja
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Contado en caja
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={contado}
                  onChange={function (e) { setContado(e.target.value) }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Retiro
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={retiro}
                  placeholder="0"
                  onChange={function (e) { setRetiro(e.target.value) }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {retiroMayor && (
              <p className="text-xs text-red-500 font-medium">El retiro no puede ser mayor a lo contado</p>
            )}

            <div className="bg-slate-50 rounded-2xl p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Esperado</span>
                <span className="font-semibold text-blue-500">{formatPeso(caja.efectivoEsperado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diferencia</span>
                {!valido ? (
                  <span className="text-slate-300">—</span>
                ) : dif === 0 ? (
                  <span className="font-semibold text-emerald-600">Sin diferencia</span>
                ) : dif < 0 ? (
                  <span className="font-semibold text-red-500">Faltante {formatPeso(-dif)}</span>
                ) : (
                  <span className="font-semibold text-orange-600">Sobrante {formatPeso(dif)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queda para mañana</span>
                <span className="font-bold text-emerald-600">{valido ? formatPeso(queda) : '—'}</span>
              </div>
            </div>

            <input
              type="text"
              value={nota}
              onChange={function (e) { setNota(e.target.value) }}
              placeholder="Nota (opcional), por ejemplo el motivo de una diferencia"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="flex gap-2">
              <button
                onClick={function () { setMostrarCierre(false) }}
                className="flex-1 border border-slate-200 text-blue-500 py-2 rounded-xl text-sm cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={cerrarCaja}
                disabled={cerrando || !valido}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        )}
      </div>
      {banner}
    </>
  )
}