'use client'

import { useState } from 'react'
import { ISupplier } from '@/types'
import { Toaster } from 'sonner'
import ProveedoresList from '@/components/proveedores/ProveedoresList'
import ProveedorForm from '@/components/proveedores/ProveedorForm'

export default function ProveedoresPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [proveedorEditar, setProveedorEditar] = useState<ISupplier | null>(null)
  const [refresh, setRefresh] = useState(0)

  function handleNuevo() {
    setProveedorEditar(null)
    setMostrarForm(true)
  }

  function handleEditar(proveedor: ISupplier) {
    setProveedorEditar(proveedor)
    setMostrarForm(true)
  }

  function handleGuardado() {
    setMostrarForm(false)
    setProveedorEditar(null)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Proveedores</h1>
        <p className="text-slate-500 text-sm mt-1">Gestion de proveedores</p>
      </div>

      <ProveedoresList
        key={refresh}
        onNuevo={handleNuevo}
        onEditar={handleEditar}
      />

      {mostrarForm && (
        <ProveedorForm
          proveedor={proveedorEditar}
          onGuardado={handleGuardado}
          onCerrar={() => {
            setMostrarForm(false)
            setProveedorEditar(null)
          }}
        />
      )}
    </div>
  )
}