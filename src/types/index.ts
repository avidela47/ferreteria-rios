// ── AUTH ──────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'vendedor'

export interface IUser {
  _id: string
  nombre: string
  email: string
  rol: UserRole
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// ── CATEGORIAS ────────────────────────────────────────────────────────────
export interface ICategory {
  _id: string
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// ── PROVEEDORES ───────────────────────────────────────────────────────────
export interface ISupplier {
  _id: string
  nombre: string
  telefono: string
  email: string
  direccion: string
  cuit: string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// ── PRODUCTOS ─────────────────────────────────────────────────────────────
export interface IProduct {
  _id: string
  codigo?: string
  nombre: string
  categoria: ICategory | string
  cantidad: number
  stockMinimo: number
  unidad: string
  precioCosto: number
  precioVenta: number
  margen: number
  proveedor: ISupplier | string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// ── VENTAS ────────────────────────────────────────────────────────────────
export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'posnet'
export type EstadoVenta = 'completada' | 'anulada'

export interface ISaleItem {
  producto: IProduct | string
  nombre: string
  cantidad: number
  precioCosto: number
  precioVenta: number
  subtotal: number
}

export interface ISale {
  _id: string
  numero: number
  cliente: string
  items: ISaleItem[]
  total: number
  costoTotal: number
  ganancia: number
  formaPago: FormaPago
  estado: EstadoVenta
  nota: string
  vendedor: IUser | string
  createdAt: Date
  updatedAt: Date
}

// ── COMPRAS ───────────────────────────────────────────────────────────────
export type EstadoCompra = 'borrador' | 'enviada' | 'recibida' | 'cancelada'

export interface IPurchaseItem {
  producto: IProduct | string
  nombre: string
  cantidad: number
  precioCosto: number
  subtotal: number
}

export interface IPurchase {
  _id: string
  numero: number
  proveedor: ISupplier | string
  items: IPurchaseItem[]
  total: number
  estado: EstadoCompra
  nota: string
  createdAt: Date
  updatedAt: Date
}

// ── GASTOS ────────────────────────────────────────────────────────────────
export type CategoriaGasto =
  | 'alquiler'
  | 'servicios'
  | 'flete'
  | 'impuestos'
  | 'sueldos'
  | 'mantenimiento'
  | 'otros'

export interface IExpense {
  _id: string
  descripcion: string
  categoria: CategoriaGasto
  monto: number
  fecha: Date
  comprobante: string
  recurrente: boolean
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// ── IMPUESTOS ─────────────────────────────────────────────────────────────
export type TipoImpuesto = 'IVA' | 'IIBB' | 'monotributo' | 'municipal' | 'otro'

export interface ITaxRecord {
  _id: string
  tipo: TipoImpuesto
  periodo: string
  monto: number
  vencimiento: Date
  pagado: boolean
  comprobante: string
  nota: string
  createdAt: Date
  updatedAt: Date
}

// ── REPORTES ──────────────────────────────────────────────────────────────
export interface IReporteSemanal {
  semana: string
  totalVentas: number
  totalCostos: number
  totalGastos: number
  ganancia: number
  cantidadVentas: number
  ventasPorDia: { dia: string; total: number; cantidad: number }[]
  topProductos: { nombre: string; cantidad: number; total: number }[]
}

export interface IReporteMensual {
  mes: string
  anio: number
  totalVentas: number
  totalCostos: number
  totalGastos: number
  totalImpuestos: number
  totalCompras: number
  ganancia: number
  cantidadVentas: number
  ventasPorSemana: { semana: string; total: number }[]
  gastosPorCategoria: { categoria: string; total: number }[]
  topProductos: { nombre: string; cantidad: number; total: number }[]
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
export interface IDashboard {
  ventasHoy: number
  ventasSemana: number
  ventasMes: number
  gananciaHoy: number
  gananciaMes: number
  cantidadVentasHoy: number
  stockBajo: IProduct[]
  ultimasVentas: ISale[]
  gastosMes: number
  impuestosPendientes: ITaxRecord[]
}

// ── API RESPONSES ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  mensaje?: string
}

export interface PaginatedResponse<T> {
  ok: boolean
  data: T[]
  total: number
  pagina: number
  totalPaginas: number
}