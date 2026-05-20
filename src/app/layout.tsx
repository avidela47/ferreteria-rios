import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ferreteria Rios',
  description: 'Sistema de gestion',
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
  <html lang="es">
    <head>
      <link rel="icon" type="image/png" href="/favicon.png" />
    </head>
    <body className={inter.className}>{children}</body>
  </html>
)
}