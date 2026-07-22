import mongoose, { Schema, Document } from 'mongoose'

export interface IStockAdjustmentDocument extends Document {
  numero: number
  producto: mongoose.Types.ObjectId
  codigo: string
  nombre: string
  cantidad: number
  precioCosto: number
  motivo: string
  nota: string
  usuario: string
  createdAt: Date
  updatedAt: Date
}

const StockAdjustmentSchema = new Schema<IStockAdjustmentDocument>(
  {
    numero: { type: Number, required: true },
    producto: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    codigo: { type: String, default: '' },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioCosto: { type: Number, default: 0 },
    motivo: {
      type: String,
      enum: ['rotura', 'uso_interno', 'perdida', 'otro'],
      required: true,
    },
    nota: { type: String, default: '' },
    usuario: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.StockAdjustment ||
  mongoose.model<IStockAdjustmentDocument>('StockAdjustment', StockAdjustmentSchema)