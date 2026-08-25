'use client'

import { useState } from 'react'
import { Toaster } from 'sonner'
import Link from 'next/link'
import { Star } from 'lucide-react'
import ReporteSemanal from '@/components/reportes/ReporteSemanal'
import ReporteMensual from '@/components/reportes/ReporteMensual'

export default function ReportesPage() {
  const [vista, setVista] = useState<'semanal' | 'mensual'>('mensual')

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresos, egresos y analisis del negocio</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVista('semanal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista === 'semanal'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setVista('mensual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista === 'mensual'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mensual
          </button>
          <Link
            href="/dashboard/reportes/pareto"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Star size={15} className="text-yellow-500" />
            Análisis 80/20
          </Link>
        </div>
      </div>

      {vista === 'semanal' ? <ReporteSemanal /> : <ReporteMensual />}
    </div>
  )
}