'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Toaster } from 'sonner'
import CatalogoList from '@/components/catalogo/CatalogoList'
import CatalogoForm from '@/components/catalogo/CatalogoForm'
import { IFicha } from '@/types/catalogo'

export default function CatalogoPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [mostrarForm, setMostrarForm] = useState(false)
  const [fichaEditar, setFichaEditar] = useState<IFicha | null>(null)
  const [refresh, setRefresh] = useState(0)

  function handleNuevo() {
    setFichaEditar(null)
    setMostrarForm(true)
  }

  function handleEditar(ficha: IFicha) {
    setFichaEditar(ficha)
    setMostrarForm(true)
  }

  function handleGuardado() {
    setMostrarForm(false)
    setFichaEditar(null)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm mt-1">Fichas técnicas y guía de venta</p>
        </div>
        {esAdmin && (
          <button
            onClick={handleNuevo}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nueva ficha
          </button>
        )}
      </div>

      <CatalogoList
        onEditar={handleEditar}
        esAdmin={esAdmin}
        refresh={refresh}
      />

      {mostrarForm && esAdmin && (
        <CatalogoForm
          ficha={fichaEditar}
          onGuardado={handleGuardado}
          onCerrar={() => {
            setMostrarForm(false)
            setFichaEditar(null)
          }}
        />
      )}
    </div>
  )
}