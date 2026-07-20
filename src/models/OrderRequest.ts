import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const OrderItemSchema = new Schema(
  {
    codigo: { type: String, default: '' },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioCosto: { type: Number, default: 0 },
    nuevo: { type: Boolean, default: false },
  },
  { _id: false }
)

const OrderRequestSchema = new Schema(
  {
    numero: { type: Number, required: true },
    items: { type: [OrderItemSchema], default: [] },
    nota: { type: String, default: '' },
    estado: { type: String, enum: ['borrador', 'confirmado'], default: 'borrador' },
  },
  { timestamps: true }
)

const OrderRequest = mongoose.models.OrderRequest || mongoose.model('OrderRequest', OrderRequestSchema)

export default OrderRequest