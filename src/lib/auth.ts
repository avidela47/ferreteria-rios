import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db/mongoose'
import User from '@/models/User'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as { id: string; rol: string; nombre: string }).rol
        token.nombre = (user as { id: string; rol: string; nombre: string }).nombre
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.rol = token.rol as string
      session.user.nombre = token.nombre as string
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

        await connectDB()

        const user = await User.findOne({
          email: parsed.data.email,
          activo: true,
        })

        if (!user) return null

        const passwordOk = await bcrypt.compare(
          parsed.data.password,
          user.password
        )
        if (!passwordOk) return null

        return {
          id: user._id.toString(),
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
        }
      },
    }),
  ],
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)