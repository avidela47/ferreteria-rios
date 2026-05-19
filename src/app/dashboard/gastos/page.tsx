'use client'

import { useState } from 'react'
import { IExpense } from '@/types'
import { Toaster } from 'sonner'
import GastosList from '@/components/gastos/GastosList'
import GastoForm from '@/components/gastos/GastoForm'

export default function GastosPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [gastoEditar, setGastoEditar] = useState<IExpense | null>(null)
  const [refresh, setRefresh] = useState(0)

  function handleNuevo() {
    setGastoEditar(null)
    setMostrarForm(true)
  }

  function handleEditar(gasto: IExpense) {
    setGastoEditar(gasto)
    setMostrarForm(true)
  }

  function handleGuardado() {
    setMostrarForm(false)
    setGastoEditar(null)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
        <p className="text-slate-500 text-sm mt-1">Egresos y gastos operativos</p>
      </div>

      <GastosList
        key={refresh}
        onNuevo={handleNuevo}
        onEditar={handleEditar}
      />

      {mostrarForm && (
        <GastoForm
          gasto={gastoEditar}
          onGuardado={handleGuardado}
          onCerrar={() => {
            setMostrarForm(false)
            setGastoEditar(null)
          }}
        />
      )}
    </div>
  )
}