'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatPeso, formatFechaHora } from '@/lib/utils'

interface Item {
  codigo?: string
  nombre: string
  cantidad: number
  precioVenta: number
  subtotal: number
}

interface Venta {
  numero: number
  cliente: string
  formaPago: string
  items: Item[]
  total: number
  nota: string
  createdAt: string
}

export default function ImprimirVentaPage() {
  const [venta, setVenta] = useState<Venta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVenta = async () => {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (!id) {
        setLoading(false)
        return
      }
      const res = await fetch('/api/ventas/' + id)
      const json = await res.json()
      if (json.ok) setVenta(json.data)
      setLoading(false)
    }
    fetchVenta()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando...</div>
  }

  if (!venta) {
    return <div className="p-8 text-center text-slate-400">Venta no encontrada</div>
  }

  const fecha = formatFechaHora(venta.createdAt)

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
          <p>Ticket N° {venta.numero}</p>
          <p>Fecha: {fecha}</p>
        </div>
      </div>

      <div className="mb-6 text-sm">
        <p><span className="text-slate-500">Cliente:</span> <span className="font-medium">{venta.cliente}</span></p>
        <p><span className="text-slate-500">Forma de pago:</span> <span className="font-medium capitalize">{venta.formaPago}</span></p>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="border px-3 py-2 text-left">Código</th>
            <th className="border px-3 py-2 text-left">Producto</th>
            <th className="border px-3 py-2 text-right">Cantidad</th>
            <th className="border px-3 py-2 text-right">P. Unit.</th>
            <th className="border px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map(function (item, i) {
            return (
              <tr key={i}>
                <td className="border px-3 py-2">{item.codigo || '-'}</td>
                <td className="border px-3 py-2">{item.nombre}</td>
                <td className="border px-3 py-2 text-right">{item.cantidad}</td>
                <td className="border px-3 py-2 text-right">{formatPeso(item.precioVenta)}</td>
                <td className="border px-3 py-2 text-right">{formatPeso(item.subtotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="text-right">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-orange-500">{formatPeso(venta.total)}</p>
        </div>
      </div>

      {venta.nota && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nota</p>
          <p className="text-sm text-slate-700">{venta.nota}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-8 text-center">
        Gracias por su compra
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