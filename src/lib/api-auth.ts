
import { NextResponse } from 'next/server'

export async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'No autorizado' },
        { status: 401 }
      ),
      session: null,
    }
  }
  return { error: null, session }
}