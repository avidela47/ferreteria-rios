'use client'

import { useState } from 'react'
import { Toaster } from 'sonner'
import ComprasList from '@/components/compras/ComprasList'
import NuevaCompra from '@/components/compras/NuevaCompra'

export default function ComprasPage() {
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Compras</h1>
          <p className="text-slate-500 text-sm mt-1">Ordenes de compra a proveedores</p>
        </div>
        <button
          onClick={() => setVista(vista === 'lista' ? 'nueva' : 'lista')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
        >
          {vista === 'lista' ? '+ Nueva orden' : '← Volver'}
        </button>
      </div>

      {vista === 'lista' ? (
        <ComprasList key={refresh} />
      ) : (
        <NuevaCompra
          onGuardado={() => {
            setVista('lista')
            setRefresh((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}