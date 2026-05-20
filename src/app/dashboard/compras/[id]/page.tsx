import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OrdenDetalle from '@/components/compras/OrdenDetalle'

export default async function OrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  const { id } = await params

  return <OrdenDetalle id={id} />
}