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
  ClipboardList,
  ListChecks,
} from 'lucide-react'

const menuCompleto = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, soloAdmin: false },
  { href: '/dashboard/catalogo', label: 'Catalogo', icon: BookOpen, soloAdmin: false },
  { href: '/dashboard/stock', label: 'Stock', icon: Package, soloAdmin: false },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ShoppingCart, soloAdmin: false },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ListChecks, soloAdmin: true },
  { href: '/dashboard/compras', label: 'Compras', icon: TrendingUp, soloAdmin: true },
  { href: '/dashboard/presupuestos', label: 'Presupuestos', icon: ClipboardList, soloAdmin: true },
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
    <aside className="w-64 bg-white h-screen flex flex-col overflow-hidden border-r border-slate-200">
      <div className="px-5 py-2 flex justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="Ferreteria Rios"
          width={110}
          height={55}
          priority
        />
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-200 shrink-0">
        <div className="mb-2 px-3">
          <p className="text-slate-800 text-sm font-medium">{nombreUsuario}</p>
          <p className="text-slate-400 text-xs capitalize">{rol}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}