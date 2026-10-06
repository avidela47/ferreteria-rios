'use client'

import { useState } from 'react'
import { IExpense } from '@/types'
import { Toaster } from 'sonner'
import GastosList from '@/components/gastos/GastosList'
import GastoForm from '@/components/gastos/GastoForm'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function GastosPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [gastoEditar, setGastoEditar] = useState<IExpense | null>(null)
  const [refresh, setRefresh] = useState(0)

  const ahora = new Date()
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [mes, setMes] = useState(ahora.getMonth())

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
    setRefresh(function (r) { return r + 1 })
  }

  function mesAnterior() {
    if (mes === 0) {
      setMes(11)
      setAnio(function (a) { return a - 1 })
    } else {
      setMes(function (m) { return m - 1 })
    }
  }

  function mesSiguiente() {
    if (mes === 11) {
      setMes(0)
      setAnio(function (a) { return a + 1 })
    } else {
      setMes(function (m) { return m + 1 })
    }
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Gastos</h1>
        <p className="text-slate-500 text-sm mt-1">Egresos y gastos operativos</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3">
        <button
          onClick={mesAnterior}
          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-blue-500 w-48 text-center">
          {NOMBRES_MES[mes]} {anio}
        </span>
        <button
          onClick={mesSiguiente}
          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <GastosList
        key={refresh}
        onNuevo={handleNuevo}
        onEditar={handleEditar}
        anio={anio}
        mes={mes}
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