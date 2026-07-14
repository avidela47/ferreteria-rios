import mongoose, { Schema, Document } from 'mongoose'
import { EstadoCompra } from '@/types'

export interface IPurchaseItemDocument {
  producto?: mongoose.Types.ObjectId | null
  codigo?: string
  nombre: string
  cantidad: number
  precioCosto: number
  subtotal: number
  nuevo?: boolean
}

export interface IPurchaseDocument extends Document {
  numero: number
  proveedor: mongoose.Types.ObjectId
  items: IPurchaseItemDocument[]
  total: number
  estado: EstadoCompra
  nota: string
  createdAt: Date
  updatedAt: Date
}

const PurchaseItemSchema = new Schema<IPurchaseItemDocument>({
  producto: { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
  codigo: { type: String, default: '' },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioCosto: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  nuevo: { type: Boolean, default: false },
})

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    numero: { type: Number, unique: true },
    proveedor: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [PurchaseItemSchema],
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: ['borrador', 'enviada', 'recibida', 'cancelada'],
      default: 'borrador',
    },
    nota: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.Purchase ||
  mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema)