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
    <div className="flex h-screen overflow-hidden bg-[#F6F3EE] print:h-auto print:overflow-visible print:block print:bg-white">
      <Sidebar nombreUsuario={session.user.nombre} rol={session.user.rol} />
      <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
        {children}
      </main>
    </div>
  )
}