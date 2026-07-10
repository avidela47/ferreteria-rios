'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Item {
  codigo: string
  descripcion: string
  cantidad: number
  nuevo: boolean
}

interface Proveedor {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
}

interface Presupuesto {
  numero: number
  proveedor: Proveedor
  items: Item[]
  nota: string
  createdAt: string
}

export default function ImprimirPresupuestoPage() {
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPresupuesto = async () => {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (!id) {
        setLoading(false)
        return
      }
      const res = await fetch('/api/presupuestos/' + id)
      const json = await res.json()
      if (json.ok) setPresupuesto(json.data)
      setLoading(false)
    }
    fetchPresupuesto()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando...</div>
  }

  if (!presupuesto) {
    return <div className="p-8 text-center text-slate-400">Pedido no encontrado</div>
  }

  const fecha = new Date(presupuesto.createdAt).toLocaleDateString('es-AR')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 print:hidden">
        <button
          onClick={function () { window.print() }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-800">
        <Image src="/logo.png" alt="Ferreteria Rios" width={140} height={70} priority />
        <div className="text-right text-sm text-slate-600">
          <p className="font-bold text-lg text-slate-800">Ferreteria Rios</p>
          <p>Pedido de Presupuesto N° {presupuesto.numero}</p>
          <p>Fecha: {fecha}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Proveedor</p>
        <p className="font-medium text-slate-800">{presupuesto.proveedor.nombre}</p>
        {presupuesto.proveedor.telefono && (
          <p className="text-sm text-slate-500">Tel: {presupuesto.proveedor.telefono}</p>
        )}
        {presupuesto.proveedor.email && (
          <p className="text-sm text-slate-500">Email: {presupuesto.proveedor.email}</p>
        )}
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="border px-3 py-2 text-left">Código</th>
            <th className="border px-3 py-2 text-left">Descripción</th>
            <th className="border px-3 py-2 text-right">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {presupuesto.items.map(function (item, i) {
            return (
              <tr key={i}>
                <td className="border px-3 py-2">{item.codigo || '-'}</td>
                <td className="border px-3 py-2">{item.descripcion}</td>
                <td className="border px-3 py-2 text-right">{item.cantidad}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {presupuesto.nota && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nota</p>
          <p className="text-sm text-slate-700">{presupuesto.nota}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-8">
        Este pedido no incluye precios. Solicitamos cotización de los productos detallados.
      </p>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}