'use client'

import { useState, useEffect, useRef } from 'react'
import { IPurchase, IPurchaseItem } from '@/types'
import { formatPeso, formatFecha } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Printer, ArrowLeft, Trash2, Save } from 'lucide-react'

interface Props {
  id: string
}

export default function OrdenDetalle({ id }: Props) {
  const [compra, setCompra] = useState<IPurchase | null>(null)
  const [items, setItems] = useState<IPurchaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCompra = async () => {
      const res = await fetch('/api/compras/' + id)
      const json = await res.json()
      if (json.ok) {
        setCompra(json.data)
        setItems(json.data.items)
      }
      setLoading(false)
    }
    fetchCompra()
  }, [id])

  async function marcarEnviada() {
    const res = await fetch('/api/compras/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'enviada' }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Orden marcada como enviada')
      setCompra(function (prev) { return prev ? Object.assign({}, prev, { estado: 'enviada' }) : prev })
    }
  }

  function cambiarCantidad(index: number, valor: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      const cant = Math.max(1, valor)
      copia[index] = Object.assign({}, copia[index], { cantidad: cant, subtotal: cant * copia[index].precioCosto })
      return copia
    })
  }

  function cambiarPrecio(index: number, valor: number) {
    setItems(function (prev) {
      const copia = prev.slice()
      copia[index] = Object.assign({}, copia[index], { precioCosto: valor, subtotal: copia[index].cantidad * valor })
      return copia
    })
  }

  function eliminarItem(index: number) {
    setItems(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  const totalActual = items.reduce(function (acc, i) { return acc + i.subtotal }, 0)
  const huboCambios = compra ? JSON.stringify(items) !== JSON.stringify(compra.items) : false

  async function guardarCambios() {
    if (items.length === 0) {
      toast.error('La orden debe tener al menos un producto')
      return
    }
    setGuardando(true)
    const res = await fetch('/api/compras/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items, total: totalActual }),
    })
    const json = await res.json()
    if (json.ok) {
      toast.success('Orden actualizada')
      setCompra(json.data)
      setItems(json.data.items)
    } else {
      toast.error(json.error || 'Error al guardar')
    }
    setGuardando(false)
  }

  function imprimir() {
    window.print()
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>
  if (!compra) return <div className="p-8 text-center text-slate-400">Orden no encontrada</div>

  const proveedor = typeof compra.proveedor === 'object' ? compra.proveedor : null
  const numeroFormato = 'OC-001-' + String(compra.numero).padStart(5, '0')
  const esEditable = compra.estado === 'borrador'

  return (
    <>
      <div className="p-6 flex items-center gap-3 print:hidden">
        <button
          onClick={function () { router.back() }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer text-sm"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1" />
        {esEditable && huboCambios && (
          <button
            onClick={guardarCambios}
            disabled={guardando}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
        {esEditable && (
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

      <div ref={printRef} className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-6">

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
            <span className={
              'inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ' +
              (compra.estado === 'borrador' ? 'bg-slate-100 text-slate-600' :
              compra.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
              compra.estado === 'recibida' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700')
            }>
              {compra.estado.toUpperCase()}
            </span>
          </div>
        </div>

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

        {esEditable && (
          <p className="text-xs text-orange-500 mb-2 print:hidden">
            Orden en borrador: podés editar cantidad, precio o quitar productos antes de enviarla.
          </p>
        )}

        {/* Sin tfoot a propósito: al paginar la impresión en varias hojas, el tfoot
            se ancla mal (Chrome lo trata como fila que "repite" y lo empuja al
            corte de la primera hoja en vez de al final real del contenido).
            El total ahora es un bloque normal después de la tabla. */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 font-semibold text-slate-700">Código</th>
              <th className="text-left py-2 font-semibold text-slate-700">Producto</th>
              <th className="text-center py-2 font-semibold text-slate-700">Cantidad</th>
              <th className="text-right py-2 font-semibold text-slate-700">P. Unitario</th>
              <th className="text-right py-2 font-semibold text-slate-700">Subtotal</th>
              {esEditable && <th className="print:hidden"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map(function (item, i) {
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-500 text-xs">{item.codigo || '-'}</td>
                  <td className="py-2.5 text-slate-700">{item.nombre}</td>
                  <td className="py-2.5 text-center text-slate-600">
                    {esEditable ? (
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={function (e) { cambiarCantidad(i, Number(e.target.value)) }}
                        className="w-16 border border-slate-200 rounded px-2 py-1 text-center text-sm print:hidden"
                      />
                    ) : item.cantidad}
                    {esEditable && <span className="hidden print:inline">{item.cantidad}</span>}
                  </td>
                  <td className="py-2.5 text-right text-slate-600">
                    {esEditable ? (
                      <input
                        type="number"
                        step="0.01"
                        value={item.precioCosto}
                        onChange={function (e) { cambiarPrecio(i, Number(e.target.value)) }}
                        className="w-24 border border-slate-200 rounded px-2 py-1 text-right text-sm print:hidden"
                      />
                    ) : formatPeso(item.precioCosto)}
                    {esEditable && <span className="hidden print:inline">{formatPeso(item.precioCosto)}</span>}
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-800">{formatPeso(item.subtotal)}</td>
                  {esEditable && (
                    <td className="py-2.5 text-center print:hidden">
                      <button
                        onClick={function () { eliminarItem(i) }}
                        className="text-slate-300 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Total: bloque normal (no tfoot), pegado al final real del contenido en impresión */}
        <div className="flex justify-end border-t-2 border-slate-200 py-3 mb-6 break-inside-avoid">
          <span className="font-bold text-slate-800 mr-6">TOTAL</span>
          <span className="font-bold text-orange-500 text-base">{formatPeso(totalActual)}</span>
        </div>

        {compra.nota && (
          <div className="border-t pt-4">
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Nota</p>
            <p className="text-slate-600 text-sm">{compra.nota}</p>
          </div>
        )}

        <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between text-sm text-slate-400">
          <span>Ferreteria Rios · Bv. Los Granaderos Nº 2019 - Bº San Martin · Cordoba</span>
          <span>{numeroFormato}</span>
        </div>
      </div>

      <style jsx global>{`
  @media print {
    nav, aside, .print\\:hidden { display: none !important; }
    body { background: white; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr, .break-inside-avoid { break-inside: avoid; }
  }
`}</style>
    </>
  )
}