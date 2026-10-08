'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const usuarioLimpio = usuario.trim().toLowerCase()
    const email = usuarioLimpio.includes('@')
      ? usuarioLimpio
      : usuarioLimpio + '@ferreteriarios.com'

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Usuario o contrasena incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Ferreteria Rios"
            width={140}
            height={140}
            priority
          />
        </div>

        <h1 className="text-center text-xl font-bold text-blue-500 mb-1">
          Bienvenido
        </h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Sistema de gestion
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="ariel"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}