'use client'

import { useState, useEffect } from 'react'
import { IFicha } from '@/types/catalogo'
import { Pencil, Trash2, ChevronDown, ChevronUp, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPeso } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  onEditar: (ficha: IFicha) => void
  esAdmin: boolean
  refresh: number
}

const COLORES_CATEGORIA: Record<string, string> = {
  'Electricidad': 'bg-yellow-100 text-yellow-800',
  'Plomeria': 'bg-blue-100 text-blue-800',
  'Herramientas': 'bg-red-100 text-red-800',
  'Pintureria': 'bg-teal-100 text-teal-800',
  'Fijaciones y buloneria': 'bg-green-100 text-green-800',
  'Adhesivos y selladores': 'bg-purple-100 text-purple-800',
  'Cerrajeria y herrajes': 'bg-orange-100 text-orange-800',
  'Materiales de obra': 'bg-pink-100 text-pink-800',
  'Seguridad y EPP': 'bg-indigo-100 text-indigo-800',
  'Lubricantes y Quimica': 'bg-lime-100 text-lime-800',
  'Gas': 'bg-cyan-100 text-cyan-800',
  'Varios': 'bg-slate-200 text-slate-700',
}

const POR_PAGINA = 50

interface ProductoStock {
  codigo?: string
  precioVenta: number
  cantidad: number
  unidad: string
}

export default function CatalogoList({ onEditar, esAdmin, refresh }: Props) {
  const [fichas, setFichas] = useState<IFicha[]>([])
  const [productosMap, setProductosMap] = useState<Record<string, ProductoStock>>({})
  const [buscar, setBuscar] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [grupoPagina, setGrupoPagina] = useState(0)

  useEffect(() => {
    const fetchFichas = async () => {
      const res = await fetch('/api/catalogo')
      const json = await res.json()
      if (json.ok) setFichas(json.data)
    }
    fetchFichas()
  }, [refresh])

  useEffect(() => {
    const fetchProductos = async () => {
      const res = await fetch('/api/productos?limite=1000')
      const json = await res.json()
      if (json.ok) {
        const mapa: Record<string, ProductoStock> = {}
        for (let i = 0; i < json.data.length; i++) {
          const p = json.data[i]
          if (p.codigo) {
            mapa[p.codigo] = {
              codigo: p.codigo,
              precioVenta: p.precioVenta,
              cantidad: p.cantidad,
              unidad: p.unidad,
            }
          }
        }
        setProductosMap(mapa)
      }
    }
    fetchProductos()
  }, [])

  async function eliminar(id: string) {
    toast('¿Seguro que querés eliminar esta ficha?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch('/api/catalogo/' + id, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Ficha eliminada')
            setFichas(function (prev) {
              return prev.filter(function (f) { return f._id !== id })
            })
          } else {
            toast.error('Error al eliminar')
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    })
  }

  const categorias = [...new Set(fichas.map((f) => f.categoria))].sort()

  function normalizar(texto: string) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  const buscarNormalizado = normalizar(buscar)

  const fichasFiltradas = fichas.filter((f) => {
    const matchBuscar = buscar === '' ||
      normalizar(f.nombre ?? '').includes(buscarNormalizado) ||
      normalizar(f.codigo ?? '').includes(buscarNormalizado) ||
      normalizar(f.descripcion ?? '').includes(buscarNormalizado) ||
      normalizar(f.paraQueSirve ?? '').includes(buscarNormalizado)
    const matchCategoria = categoriaFiltro === '' || f.categoria === categoriaFiltro
    return matchBuscar && matchCategoria
  })

  const totalPaginas = Math.ceil(fichasFiltradas.length / POR_PAGINA)
  const fichasPagina = fichasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  function handleBuscar(valor: string) {
    setBuscar(valor)
    setPagina(1)
    setGrupoPagina(0)
  }

  function handleCategoria(valor: string) {
    setCategoriaFiltro(valor)
    setPagina(1)
    setGrupoPagina(0)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, descripción o uso..."
            value={buscar}
            onChange={(e) => handleBuscar(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={(e) => handleCategoria(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-sm text-slate-400 whitespace-nowrap">
          {fichasFiltradas.length} fichas
        </span>
      </div>

      {fichasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">No hay fichas que coincidan</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {fichasPagina.map((ficha) => {
              const info = ficha.codigo ? productosMap[ficha.codigo] : undefined
              return (
                <div key={ficha._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandida(expandida === ficha._id ? null : ficha._id ?? null)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLORES_CATEGORIA[ficha.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ficha.categoria || 'Sin categoría'}
                        </span>
                        {ficha.codigo && (
                          <span className="text-xs text-slate-400 font-mono">#{ficha.codigo}</span>
                        )}
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                          {ficha.nombre}
                        </h3>
                      </div>
                      {expandida !== ficha._id && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{ficha.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {esAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditar(ficha) }}
                            className="text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); eliminar(ficha._id ?? '') }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {expandida === ficha._id
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </div>

                  {expandida === ficha._id && (
                    <div className="border-t border-slate-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {ficha.imagen && (
                          <Image src={ficha.imagen} alt={ficha.nombre} width={150} height={150} className="w-37.5 h-37.5 rounded-lg border border-slate-200 object-contain bg-white" unoptimized />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Código</p>
                          <p className="text-sm text-slate-700">{ficha.codigo || 'Sin código'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Descripción</p>
                          <p className="text-sm text-slate-700">{ficha.descripcion}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Para qué sirve</p>
                          <p className="text-sm text-slate-700">{ficha.paraQueSirve}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Quién lo pide</p>
                          <p className="text-sm text-slate-700">{ficha.quienLoPide}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cómo se usa</p>
                          <p className="text-sm text-slate-700">{ficha.comoSeUsa}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Forma / Apariencia</p>
                          <p className="text-sm text-slate-700">{ficha.formaApariencia}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">⚡ Datos clave</p>
                          <p className="text-sm text-slate-700 bg-orange-50 rounded-lg p-2">{ficha.datosClave}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">🔗 Venta cruzada</p>
                          <div className="flex flex-wrap gap-1">
                            {ficha.ventaCruzada.map((v, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Precio de venta</p>
                            <p className="text-sm font-medium text-slate-700">
                              {info ? formatPeso(info.precioVenta) : 'Sin stock cargado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Stock</p>
                            <p className="text-sm font-medium text-slate-700">
                              {info ? info.cantidad + ' ' + info.unidad : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-4 py-3">
            <span className="text-sm text-slate-500">
              {fichasFiltradas.length} fichas · Página {pagina} de {totalPaginas}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={function () {
                  const nuevaPagina = Math.max(1, pagina - 1)
                  setPagina(nuevaPagina)
                  setGrupoPagina(Math.floor((nuevaPagina - 1) / 3))
                }}
                disabled={pagina === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: 3 }, function (_, i) { return grupoPagina * 3 + i + 1 })
                .filter(function (n) { return n <= totalPaginas })
                .map(function (n) {
                  const esUltimoDelGrupo = n === Math.min((grupoPagina + 1) * 3, totalPaginas)
                  return (
                    <button
                      key={n}
                      onClick={function () {
                        setPagina(n)
                        if (esUltimoDelGrupo && n < totalPaginas) {
                          setGrupoPagina(function (g) { return g + 1 })
                        }
                      }}
                      className={
                        'w-8 h-8 rounded text-sm transition-colors ' +
                        (n === pagina
                          ? 'bg-orange-500 text-white font-medium'
                          : 'border border-slate-200 text-slate-500 hover:bg-slate-50')
                      }
                    >
                      {n}
                    </button>
                  )
                })}
              <button
                onClick={function () {
                  const nuevaPagina = Math.min(totalPaginas, pagina + 1)
                  setPagina(nuevaPagina)
                  setGrupoPagina(Math.floor((nuevaPagina - 1) / 3))
                }}
                disabled={pagina === totalPaginas}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}