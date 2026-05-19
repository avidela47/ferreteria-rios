'use client'

import { useState } from 'react'
import { Toaster } from 'sonner'
import VentasList from '@/components/ventas/VentasList'
import NuevaVenta from '@/components/ventas/NuevaVenta'

export default function VentasPage() {
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ventas</h1>
          <p className="text-slate-500 text-sm mt-1">Punto de venta e historial</p>
        </div>
        <button
          onClick={() => setVista(vista === 'lista' ? 'nueva' : 'lista')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        >
          {vista === 'lista' ? '+ Nueva venta' : '← Volver'}
        </button>
      </div>

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