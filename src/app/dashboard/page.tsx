import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { IDashboard } from '@/types'
import StatsCard from '@/components/dashboard/StatsCard'
import StockBajoTable from '@/components/dashboard/StockBajoTable'
import UltimasVentas from '@/components/dashboard/UltimasVentas'
import ImpuestosPendientes from '@/components/dashboard/ImpuestosPendientes'
import { formatPeso } from '@/lib/utils'

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

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getDashboard(session)

  return (
    <div className="p-6 space-y-6">
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
        />
        <StatsCard
          titulo="Ganancia hoy"
          valor={formatPeso(data?.gananciaHoy ?? 0)}
          subtitulo="margen bruto"
          color="green"
        />
        <StatsCard
          titulo="Ventas del mes"
          valor={formatPeso(data?.ventasMes ?? 0)}
          subtitulo={`Ganancia: ${formatPeso(data?.gananciaMes ?? 0)}`}
          color="orange"
        />
        <StatsCard
          titulo="Gastos del mes"
          valor={formatPeso(data?.gastosMes ?? 0)}
          subtitulo="egresos registrados"
          color="red"
        />
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockBajoTable productos={data?.stockBajo ?? []} />
        <UltimasVentas ventas={data?.ultimasVentas ?? []} />
      </div>

      {/* Impuestos */}
      <ImpuestosPendientes impuestos={data?.impuestosPendientes ?? []} />
    </div>
  )
}