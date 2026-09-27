'use client'

import { useState, useEffect } from 'react'
import { IFicha } from '@/types/catalogo'
import { Pencil, Trash2, ChevronDown, ChevronUp, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPeso } from '@/lib/utils'
import FotoProducto from './FotoProducto'

interface Props {
  onEditar: (ficha: IFicha) => void
  esAdmin: boolean
  refresh: number
  endpoint?: string
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

export default function CatalogoList({ onEditar, esAdmin, refresh, endpoint = '/api/catalogo' }: Props) {
  const [fichas, setFichas] = useState<IFicha[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [sinImagen, setSinImagen] = useState(false)
  const [recarga, setRecarga] = useState(0)
  const [buscar, setBuscar] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const res = await fetch(endpoint, { cache: 'no-store', signal: controller.signal })
        const json = await res.json()
        if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo cargar el catálogo')
        setFichas(json.data)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo conectar')
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    void cargar()
    function alVolver() { if (document.visibilityState === 'visible') void cargar() }
    window.addEventListener('focus', alVolver)
    return () => { controller.abort(); window.removeEventListener('focus', alVolver) }
  }, [refresh, recarga, endpoint])

  async function eliminar(id: string) {
    toast('¿Eliminar el contenido de esta ficha? El producto seguirá en stock.', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const res = await fetch('/api/catalogo/' + id, { method: 'DELETE' })
          const json = await res.json()
          if (json.ok) {
            toast.success('Ficha eliminada')
            setRecarga(r => r + 1)
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
    return matchBuscar && matchCategoria && (!sinImagen || !f.imagen)
  })

  const totalPaginas = Math.max(1, Math.ceil(fichasFiltradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const fichasPagina = fichasFiltradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  function handleBuscar(valor: string) {
    setBuscar(valor)
    setPagina(1)
  }

  function handleCategoria(valor: string) {
    setCategoriaFiltro(valor)
    setPagina(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        <span>{fichas.length} productos</span>
        <span>· {fichas.filter(f => f.imagen).length} con foto</span>
        <span>· {fichas.filter(f => !f.imagen).length} sin imagen</span>
        <button type="button" onClick={() => setRecarga(r => r + 1)} className="font-medium text-orange-600">Actualizar stock y precios</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-3 items-center">
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
  <button
    onClick={function () {
      setBuscar('')
      setCategoriaFiltro('')
      setSinImagen(false)
      setPagina(1)
    }}
    className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
  >
    Borrar
  </button>
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
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={sinImagen} onChange={e => { setSinImagen(e.target.checked); setPagina(1) }} />
          Sin imagen
        </label>
        <span className="text-sm text-slate-400 whitespace-nowrap">
          {fichasFiltradas.length} fichas
        </span>
      </div>

      {cargando ? <p role="status" className="p-8 text-center text-slate-500">Cargando catálogo...</p> : error ? (
        <div role="alert" className="rounded-lg bg-red-50 p-6 text-red-700">{error} <button onClick={() => setRecarga(r => r + 1)} className="underline">Reintentar</button></div>
      ) : fichasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">No hay fichas que coincidan</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {fichasPagina.map((ficha) => {
              const clave = ficha.productoId ?? ficha._id ?? ficha.codigo ?? ''
              const info = ficha.precioVenta !== undefined ? ficha : undefined
              return (
                <div key={clave} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandida(expandida === clave ? null : clave)}
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
                      {expandida !== clave && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{ficha.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {esAdmin && (
                        <>
                          <button
                            aria-label="Editar ficha o subir imagen"
                            onClick={(e) => { e.stopPropagation(); onEditar(ficha) }}
                            className="text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          {ficha._id && <button
                            aria-label="Eliminar contenido de ficha"
                            onClick={(e) => { e.stopPropagation(); eliminar(ficha._id ?? '') }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>}
                        </>
                      )}
                      {expandida === clave
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </div>

                  {expandida === clave && (
                    <div className="border-t border-slate-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <FotoProducto src={ficha.imagen} nombre={ficha.nombre} onCargar={esAdmin ? () => onEditar(ficha) : undefined} />
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
                        {!!ficha.ventaCruzada?.length && <div>
                          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">🔗 Venta cruzada</p>
                          <div className="flex flex-wrap gap-1">
                            {(ficha.ventaCruzada ?? []).map((v, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>}
                        {!!ficha.fuentes?.length && <div className="text-xs text-slate-500">
                          <p className="mb-1 font-semibold">Fuentes de consulta</p>
                          {ficha.fuentes.map(f => <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="block text-blue-700 underline">{f.titulo}</a>)}
                        </div>}
                        <div className="flex gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Precio de venta</p>
                            <p className="text-sm font-medium text-slate-700">
                              {info ? formatPeso(info.precioVenta ?? 0) : 'Sin precio registrado'}
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

          <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-lg shadow-sm px-4 py-3">
            <span className="text-sm text-slate-500">
              {fichasFiltradas.length} fichas · Página {paginaActual} de {totalPaginas}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={function () {
                  const nuevaPagina = Math.max(1, paginaActual - 1)
                  setPagina(nuevaPagina)
                }}
                disabled={paginaActual === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: 3 }, function (_, i) { return Math.floor((paginaActual - 1) / 3) * 3 + i + 1 })
                .filter(function (n) { return n <= totalPaginas })
                .map(function (n) {
                  return (
                    <button
                      key={n}
                      onClick={function () {
                        setPagina(n)
                      }}
                      className={
                        'w-8 h-8 rounded text-sm transition-colors ' +
                        (n === paginaActual
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
                  const nuevaPagina = Math.min(totalPaginas, paginaActual + 1)
                  setPagina(nuevaPagina)
                }}
                disabled={paginaActual === totalPaginas}
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
