import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPeso(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(monto)
}

export function formatFecha(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function formatFechaHora(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

export function calcularMargen(precioCosto: number, precioVenta: number): number {
  if (precioCosto <= 0) return 0
  return Number((((precioVenta - precioCosto) / precioCosto) * 100).toFixed(2))
}

export function calcularPrecioVenta(precioCosto: number, margen: number): number {
  return Number((precioCosto * (1 + margen / 100)).toFixed(2))
}