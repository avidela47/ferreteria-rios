'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt,
  FileText,
  Truck,
  LogOut,
  BookOpen,
} from 'lucide-react'

const menuCompleto = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, soloAdmin: false },
  { href: '/dashboard/catalogo', label: 'Catalogo', icon: BookOpen, soloAdmin: false },
  { href: '/dashboard/stock', label: 'Stock', icon: Package, soloAdmin: false },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ShoppingCart, soloAdmin: false },
  { href: '/dashboard/compras', label: 'Compras', icon: TrendingUp, soloAdmin: true },
  { href: '/dashboard/proveedores', label: 'Proveedores', icon: Truck, soloAdmin: true },
  { href: '/dashboard/gastos', label: 'Gastos', icon: Receipt, soloAdmin: true },
  { href: '/dashboard/impuestos', label: 'Impuestos', icon: FileText, soloAdmin: true },
  { href: '/dashboard/reportes', label: 'Reportes', icon: FileText, soloAdmin: true },
]

interface SidebarProps {
  nombreUsuario: string
  rol: string
}

export default function Sidebar({ nombreUsuario, rol }: SidebarProps) {
  const pathname = usePathname()
  const esAdmin = rol === 'admin'
  const menu = menuCompleto.filter(function (item) {
    return !item.soloAdmin || esAdmin
  })

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col overflow-hidden">
      <div className="px-5 py-3">
        <Image
          src="/logo.png"
          alt="Ferreteria Rios"
          width={140}
          height={70}
          priority
          style={{ mixBlendMode: 'screen' }}
        />
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                active
                  ? 'bg-orange-500 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700">
        <div className="mb-2 px-3">
          <p className="text-white text-sm font-medium">{nombreUsuario}</p>
          <p className="text-slate-400 text-xs capitalize">{rol}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}