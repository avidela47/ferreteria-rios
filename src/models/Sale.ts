import mongoose, { Schema, Document } from 'mongoose'
import { FormaPago, EstadoVenta } from '@/types'

export interface ISaleItemDocument {
  producto?: mongoose.Types.ObjectId
  codigo?: string
  nombre: string
  cantidad: number
  precioCosto: number
  precioVenta: number
  subtotal: number
}

export interface ISaleDocument extends Document {
  numero: number
  cliente: string
  items: ISaleItemDocument[]
  total: number
  costoTotal: number
  ganancia: number
  formaPago: FormaPago
  estado: EstadoVenta
  nota: string
  vendedor: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SaleItemSchema = new Schema<ISaleItemDocument>({
  producto: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
  codigo: { type: String, default: '' },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioCosto: { type: Number, required: true },
  precioVenta: { type: Number, required: true },
  subtotal: { type: Number, required: true },
})

const SaleSchema = new Schema<ISaleDocument>(
  {
    numero: { type: Number, unique: true },
    cliente: { type: String, default: 'Consumidor Final' },
    items: [SaleItemSchema],
    total: { type: Number, required: true },
    costoTotal: { type: Number, required: true },
    ganancia: { type: Number, required: true },
    formaPago: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'posnet'],
      default: 'efectivo',
    },
    estado: {
      type: String,
      enum: ['completada', 'anulada'],
      default: 'completada',
    },
    nota: { type: String, default: '' },
    vendedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Sale ||
  mongoose.model<ISaleDocument>('Sale', SaleSchema)