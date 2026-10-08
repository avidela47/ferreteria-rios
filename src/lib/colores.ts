import type { CSSProperties } from 'react'

// Recharts no lee las variables de Tailwind, por eso los colores de los gráficos viven acá.
// Si cambia la marca, actualizar ACÁ y en la sección @theme de src/app/globals.css.
export const COLORES = {
  naranja: '#FF6B00',
  navy: '#102A43',
  navyOscuro: '#06111B',
  gris: '#9AA6B4',
}

export const PALETA_CATEGORIAS = [
  COLORES.naranja,
  COLORES.navy,
  '#FFA96B',
  '#748392',
  '#1C8A4B',
  '#C9D1DB',
]

export const TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 8px 24px rgba(16,42,67,0.12)',
  fontSize: 12,
  backgroundColor: '#fff',
}