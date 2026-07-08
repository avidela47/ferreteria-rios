'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { IProduct } from '@/types'
import ProductosList from '@/components/stock/ProductosList'
import ProductoForm from '@/components/stock/ProductoForm'
import { Toaster } from 'sonner'

export default function StockPage() {
  const { data: session } = useSession()
  const esAdmin = session?.user?.rol === 'admin'

  const [mostrarForm, setMostrarForm] = useState(false)
  const [productoEditar, setProductoEditar] = useState<IProduct | null>(null)
  const [refresh, setRefresh] = useState(0)

  function handleNuevo() {
    setProductoEditar(null)
    setMostrarForm(true)
  }

  function handleEditar(producto: IProduct) {
    setProductoEditar(producto)
    setMostrarForm(true)
  }

  function handleGuardado() {
    setMostrarForm(false)
    setProductoEditar(null)
    setRefresh((r) => r + 1)
  }

  function handleCerrar() {
    setMostrarForm(false)
    setProductoEditar(null)
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Stock</h1>
        <p className="text-slate-500 text-sm mt-1">Gestion de productos</p>
      </div>

      <ProductosList
        onNuevo={handleNuevo}
        onEditar={handleEditar}
        refresh={refresh}
        esAdmin={esAdmin}
      />

      {mostrarForm && esAdmin && (
        <ProductoForm
          producto={productoEditar}
          onGuardado={handleGuardado}
          onCerrar={handleCerrar}
        />
      )}
    </div>
  )
}