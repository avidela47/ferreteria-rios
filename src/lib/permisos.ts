import { auth } from '@/lib/auth'

export async function esAdmin() {
  const session = await auth()
  return session?.user?.rol === 'admin'
}