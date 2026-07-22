'use client'

import { useState, useEffect, useRef } from 'react'
import { IPurchase } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Printer, ArrowLeft } from 'lucide-react'

interface Props {
  id: string
}

export default function OrdenDetalle({ id }: Props) {
  const [compra, setCompra] = useState<IPurchase | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCompra = async () => {
      const res = await fetch(`/api/compras/${id}`)
      const json = await res.json()
      if (json.ok) setCompra(json.data)
      setLoading(false)
    }
    fetchCompra()
  }, [id])

  async function marcarEnviada() {
    const res = await fetch(`/api/compras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'enviada' }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Orden marcada como enviada')
      setCompra((prev) => prev ? { ...prev, estado: 'enviada' } : prev)
    }
  }

  function imprimir() {
    window.print()
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>
  if (!compra) return <div className="p-8 text-center text-slate-400">Orden no encontrada</div>

  const proveedor = typeof compra.proveedor === 'object' ? compra.proveedor : null
  const numeroFormato = `OC-001-${String(compra.numero).padStart(5, '0')}`

  return (
    <>
      {/* Botones — no se imprimen */}
      <div className="p-6 flex items-center gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer text-sm"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1" />
        {compra.estado === 'borrador' && (
          <button
            onClick={marcarEnviada}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
          >
            Marcar como enviada
          </button>
        )}
        <button
          onClick={imprimir}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
        >
          <Printer size={16} /> Imprimir / PDF
        </button>
      </div>

      {/* Orden imprimible */}
      <div ref={printRef} className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Image
              src="/logo.png"
              alt="Ferreteria Rios"
              width={120}
              height={60}
              style={{ mixBlendMode: 'multiply' }}
            />
            <p className="text-slate-500 text-sm mt-1">Bv. Los Granaderos Nº 2019 - Bº San Martin · Cordoba</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">ORDEN DE COMPRA</h1>
            <p className="text-orange-500 font-bold text-lg mt-1">{numeroFormato}</p>
            <p className="text-slate-500 text-sm mt-1">Fecha: {formatFecha(compra.createdAt)}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
              compra.estado === 'borrador' ? 'bg-slate-100 text-slate-600' :
              compra.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
              compra.estado === 'recibida' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {compra.estado.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Proveedor */}
        {proveedor && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400 uppercase font-medium mb-2">Proveedor</p>
            <p className="font-semibold text-slate-800">{proveedor.nombre}</p>
            {proveedor.cuit && <p className="text-slate-500 text-sm">CUIT: {proveedor.cuit}</p>}
            {proveedor.telefono && <p className="text-slate-500 text-sm">Tel: {proveedor.telefono}</p>}
            {proveedor.email && <p className="text-slate-500 text-sm">Email: {proveedor.email}</p>}
            {proveedor.direccion && <p className="text-slate-500 text-sm">{proveedor.direccion}</p>}
          </div>
        )}

        {/* Tabla de productos */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-200">
  <th className="text-left py-2 font-semibold text-slate-700">Código</th>
  <th className="text-left py-2 font-semibold text-slate-700">Producto</th>
  <th className="text-center py-2 font-semibold text-slate-700">Cantidad</th>
  <th className="text-right py-2 font-semibold text-slate-700">P. Unitario</th>
  <th className="text-right py-2 font-semibold text-slate-700">Subtotal</th>
</tr>
          </thead>
          <tbody>
            {compra.items.map((item, i) => (
  <tr key={i} className="border-b border-slate-100">
    <td className="py-2.5 text-slate-500 text-xs">{item.codigo || '-'}</td>
    <td className="py-2.5 text-slate-700">{item.nombre}</td>
    <td className="py-2.5 text-center text-slate-600">{item.cantidad}</td>
    <td className="py-2.5 text-right text-slate-600">{formatPeso(item.precioCosto)}</td>
    <td className="py-2.5 text-right font-medium text-slate-800">{formatPeso(item.subtotal)}</td>
  </tr>
))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td colSpan={3} className="py-3 text-right font-bold text-slate-800">TOTAL</td>
              <td className="py-3 text-right font-bold text-orange-500 text-base">{formatPeso(compra.total)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Nota */}
        {compra.nota && (
          <div className="border-t pt-4">
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Nota</p>
            <p className="text-slate-600 text-sm">{compra.nota}</p>
          </div>
        )}

        {/* Firma */}
        <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between text-sm text-slate-400">
          <span>Ferreteria Rios · Bv. Los Granaderos Nº 2019 - Bº San Martin · Cordoba</span>
          <span>{numeroFormato}</span>
        </div>
      </div>

      {/* Estilos de impresion */}
      <style jsx global>{`
  @media print {
    nav, aside, .print\\:hidden { display: none !important; }
    body { background: white; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`}</style>
    </>
  )
}