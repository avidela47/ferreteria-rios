'use client'

import { useState } from 'react'
import { ITaxRecord } from '@/types'
import { Toaster } from 'sonner'
import ImpuestosList from '@/components/impuestos/ImpuestosList'
import ImpuestoForm from '@/components/impuestos/ImpuestoForm'

export default function ImpuestosPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [impuestoEditar, setImpuestoEditar] = useState<ITaxRecord | null>(null)
  const [refresh, setRefresh] = useState(0)

  function handleNuevo() {
    setImpuestoEditar(null)
    setMostrarForm(true)
  }

  function handleEditar(impuesto: ITaxRecord) {
    setImpuestoEditar(impuesto)
    setMostrarForm(true)
  }

  function handleGuardado() {
    setMostrarForm(false)
    setImpuestoEditar(null)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Impuestos</h1>
        <p className="text-slate-500 text-sm mt-1">Control de vencimientos y pagos</p>
      </div>

      <ImpuestosList
        key={refresh}
        onNuevo={handleNuevo}
        onEditar={handleEditar}
      />

      {mostrarForm && (
        <ImpuestoForm
          impuesto={impuestoEditar}
          onGuardado={handleGuardado}
          onCerrar={() => {
            setMostrarForm(false)
            setImpuestoEditar(null)
          }}
        />
      )}
    </div>
  )
}