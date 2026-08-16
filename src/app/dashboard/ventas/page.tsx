'use client'

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import VentasList from '@/components/ventas/VentasList'
import NuevaVenta from '@/components/ventas/NuevaVenta'
import { formatPeso } from '@/lib/utils'

interface Estadisticas {
  cantidad: number
  total: number
  costoTotal: number
  ganancia: number
  hoy: { cantidad: number; total: number; ganancia: number }
  mes: { cantidad: number; total: number }
}

export default function VentasPage() {
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [refresh, setRefresh] = useState(0)
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/ventas/estadisticas')
      const json = await res.json()
      if (json.ok) setStats(json.data)
    }
    fetchStats()
  }, [refresh])

  useEffect(() => {
    const fetchCaja = async () => {
      const res = await fetch('/api/caja')
      const json = await res.json()
      setCajaAbierta(json.ok && json.data !== null)
    }
    fetchCaja()
  }, [refresh])

  function handleNuevaVenta() {
    if (vista === 'nueva') {
      setVista('lista')
      return
    }
    if (!cajaAbierta) {
      toast.error('Caja cerrada. Por favor abrir caja en el Dashboard. No olvidar contar todos los billetes.', {
        duration: 5000,
      })
      return
    }
    setVista('nueva')
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-center" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ventas</h1>
          <p className="text-slate-500 text-sm mt-1">Punto de venta e historial</p>
        </div>
        <button
          onClick={handleNuevaVenta}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        >
          {vista === 'lista' ? '+ Nueva venta' : '← Volver'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">Cantidad de ventas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.cantidad}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">Monto total (costo / venta)</p>
            <p className="text-lg font-bold text-slate-800">{formatPeso(stats.total)}</p>
            <p className="text-xs text-slate-400">Costo: {formatPeso(stats.costoTotal)}</p>
            <p className="text-xs text-green-600 font-medium">Ganancia: {formatPeso(stats.ganancia)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">Ventas de hoy</p>
            <p className="text-lg font-bold text-orange-500">{formatPeso(stats.hoy.total)}</p>
            <p className="text-xs text-slate-400">{stats.hoy.cantidad} ventas</p>
            <p className="text-xs text-green-600 font-medium">Ganancia: {formatPeso(stats.hoy.ganancia)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">Ventas del mes</p>
            <p className="text-lg font-bold text-orange-500">{formatPeso(stats.mes.total)}</p>
            <p className="text-xs text-slate-400">{stats.mes.cantidad} ventas</p>
          </div>
        </div>
      )}

      {vista === 'lista' ? (
        <VentasList key={refresh} />
      ) : (
        <NuevaVenta
          onGuardado={() => {
            setVista('lista')
            setRefresh((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}