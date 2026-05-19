import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar nombreUsuario={session.user.nombre} rol={session.user.rol} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}