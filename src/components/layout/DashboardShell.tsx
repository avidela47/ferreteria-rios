'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'

interface DashboardShellProps {
  nombreUsuario: string
  rol: string
  children: React.ReactNode
}

// Contenedor del panel: en escritorio muestra el menu lateral fijo; en celular
// y tablet (< 1024px) el menu pasa a ser un cajon que se abre con la hamburguesa.
export default function DashboardShell({ nombreUsuario, rol, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  // Abierto solo mientras no se navegue a otra ruta (se cierra solo al cambiar de pagina)
  const abierto = abiertoEn === pathname

  useEffect(() => {
    if (!abierto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbiertoEn(null)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierto])

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[#F6F3EE] print:h-auto print:overflow-visible print:block print:bg-white">
      <div className="mobile-topbar print:hidden">
        <button
          type="button"
          className="mobile-topbar-btn"
          aria-label={abierto ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={abierto}
          aria-controls="menu-lateral"
          onClick={function () { setAbiertoEn(abierto ? null : pathname) }}
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="mobile-topbar-title">Ferreteria Rios</span>
      </div>

      <div
        className={`sidebar-overlay print:hidden${abierto ? ' open' : ''}`}
        onClick={function () { setAbiertoEn(null) }}
        aria-hidden="true"
      />

      <Sidebar nombreUsuario={nombreUsuario} rol={rol} abierto={abierto} />

      <main className="app-main flex-1 overflow-y-auto print:overflow-visible print:h-auto">
        {children}
      </main>
    </div>
  )
}
