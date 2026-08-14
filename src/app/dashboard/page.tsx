import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { IDashboard } from '@/types'
import StatsCard from '@/components/dashboard/StatsCard'
import StockBajoTable from '@/components/dashboard/StockBajoTable'
import UltimasVentas from '@/components/dashboard/UltimasVentas'
import ImpuestosPendientes from '@/components/dashboard/ImpuestosPendientes'
import { formatPeso } from '@/lib/utils'
import BajasStockCard from '@/components/dashboard/BajasStockCard'
import CajaCard from '@/components/dashboard/CajaCard'

async function getDashboard(session: { user: { id: string } }): Promise<IDashboard | null> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard`, {
      cache: 'no-store',
      headers: {
        'x-user-id': session.user.id,
      },
    })
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

// Iconos inline (sin dependencias externas)
function IconoVentas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.876-4.79 2.202-7.403.038-.302-.196-.567-.5-.567H5.106M7.5 14.25L5.106 5.272M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

function IconoGanancia() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function IconoGastos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 6h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
    </svg>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getDashboard(session)

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen general del negocio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          titulo="Ventas hoy"
          valor={formatPeso(data?.ventasHoy ?? 0)}
          subtitulo={`${data?.cantidadVentasHoy ?? 0} transacciones`}
          color="blue"
          icon={<IconoVentas />}
        />
        <StatsCard
          titulo="Ganancia hoy"
          valor={formatPeso(data?.gananciaHoy ?? 0)}
          subtitulo="margen bruto"
          color="green"
          icon={<IconoGanancia />}
        />
        <StatsCard
          titulo="Ventas del mes"
          valor={formatPeso(data?.ventasMes ?? 0)}
          subtitulo={`Ganancia: ${formatPeso(data?.gananciaMes ?? 0)}`}
          color="orange"
          icon={<IconoCalendario />}
          tendencia={data?.tendenciaVentasMes}
        />
        <StatsCard
          titulo="Gastos del mes"
          valor={formatPeso(data?.gastosMes ?? 0)}
          subtitulo="compras, impuestos y otros egresos"
          color="red"
          icon={<IconoGastos />}
          tendencia={data?.tendenciaGastosMes}
          invertirColorTendencia
        />
      </div>
      
{/* Punto de equilibrio y Caja */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {data?.puntoEquilibrio != null && (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Punto de equilibrio del mes</h3>
        <span className="text-xs text-slate-400">
          Margen bruto promedio: {((data?.margenBrutoPromedio ?? 0) * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{formatPeso(data.puntoEquilibrio)}</p>
      <p className="text-xs text-slate-500 mt-1">
        Necesitás facturar esto para cubrir tus gastos fijos ({formatPeso(data?.gastosRecurrentesMes ?? 0)}) este mes
      </p>
      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${(data?.ventasMes ?? 0) >= data.puntoEquilibrio ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${Math.min(100, ((data?.ventasMes ?? 0) / data.puntoEquilibrio) * 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {(data?.ventasMes ?? 0) >= data.puntoEquilibrio
          ? '✓ Ya superaste el punto de equilibrio este mes'
          : `Facturaste ${formatPeso(data?.ventasMes ?? 0)} de ${formatPeso(data.puntoEquilibrio)} necesarios`}
      </p>
    </div>
  )}
  <CajaCard />
</div>

      {/* Tablas */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <StockBajoTable productos={data?.stockBajo ?? []} />
  <div className="space-y-6">
    <UltimasVentas ventas={data?.ultimasVentas ?? []} />
    <BajasStockCard
      cantidad={data?.bajasMesCantidad ?? 0}
      total={data?.bajasMesTotal ?? 0}
      registros={data?.bajasMesRegistros ?? 0}
      ultimas={data?.ultimasBajas ?? []}
    />
  </div>
</div>

      {/* Impuestos */}
      <ImpuestosPendientes impuestos={data?.impuestosPendientes ?? []} />
    </div>
  )
}
