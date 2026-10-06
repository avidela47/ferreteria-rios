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
  PackageMinus,
  Wallet,
} from 'lucide-react'

const menuCompleto = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, soloAdmin: false },
  { href: '/dashboard/catalogo', label: 'Catalogo', icon: BookOpen, soloAdmin: false },
  { href: '/dashboard/stock', label: 'Stock', icon: Package, soloAdmin: false },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ShoppingCart, soloAdmin: false },
  { href: '/dashboard/fiados', label: 'Fiados', icon: Wallet, soloAdmin: false },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ListChecks, soloAdmin: true },
  { href: '/dashboard/compras', label: 'Compras', icon: TrendingUp, soloAdmin: true },
  { href: '/dashboard/presupuestos', label: 'Presupuestos', icon: ClipboardList, soloAdmin: true },
  { href: '/dashboard/proveedores', label: 'Proveedores', icon: Truck, soloAdmin: true },
  { href: '/dashboard/bajas-stock', label: 'Bajas de Stock', icon: PackageMinus, soloAdmin: true },
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
    <aside className="w-64 bg-blue-500 h-screen flex flex-col overflow-hidden">
            <div className="px-5 py-5 flex justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="Ferreteria Rios"
          width={88}
          height={88}
          priority
        />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-orange-500 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <div className="mb-2 px-3.5">
          <p className="text-white text-sm font-semibold">{nombreUsuario}</p>
          <p className="text-white/45 text-xs capitalize">{rol}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}