import mongoose, { Schema, Document } from 'mongoose'

export interface IQuoteItem {
  codigo: string
  descripcion: string
  cantidad: number
  nuevo: boolean
}

export interface IQuoteRequestDocument extends Document {
  numero: number
  proveedor: mongoose.Types.ObjectId
  items: IQuoteItem[]
  nota: string
  createdAt: Date
  updatedAt: Date
}

const QuoteItemSchema = new Schema<IQuoteItem>(
  {
    codigo: { type: String, default: '' },
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    nuevo: { type: Boolean, default: false },
  },
  { _id: false }
)

const QuoteRequestSchema = new Schema<IQuoteRequestDocument>(
  {
    numero: { type: Number, required: true },
    proveedor: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [QuoteItemSchema], default: [] },
    nota: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.QuoteRequest ||
  mongoose.model<IQuoteRequestDocument>('QuoteRequest', QuoteRequestSchema)