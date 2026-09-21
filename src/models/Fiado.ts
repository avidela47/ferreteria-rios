import mongoose, { Schema, Document } from 'mongoose'

export interface IFiadoItemDocument {
  producto: mongoose.Types.ObjectId
  codigo?: string
  nombre: string
  cantidad: number
  precioCosto: number
  precioVenta: number
  subtotal: number
}

export interface IFiadoDocument extends Document {
  numero: number
  cliente: string
  items: IFiadoItemDocument[]
  total: number
  costoTotal: number
  estado: 'pendiente' | 'pagado'
  nota: string
  usuarioCarga: mongoose.Types.ObjectId
  ventaGenerada?: mongoose.Types.ObjectId
  fechaPago?: Date
  createdAt: Date
  updatedAt: Date
}

const FiadoItemSchema = new Schema<IFiadoItemDocument>(
  {
    producto: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    codigo: { type: String, default: '' },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioCosto: { type: Number, default: 0 },
    precioVenta: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
)

const FiadoSchema = new Schema<IFiadoDocument>(
  {
    numero: { type: Number, required: true, unique: true },
    cliente: { type: String, required: true },
    items: { type: [FiadoItemSchema], default: [] },
    total: { type: Number, required: true },
    costoTotal: { type: Number, required: true },
    estado: { type: String, enum: ['pendiente', 'pagado'], default: 'pendiente' },
    nota: { type: String, default: '' },
    usuarioCarga: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ventaGenerada: { type: Schema.Types.ObjectId, ref: 'Sale' },
    fechaPago: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.models.Fiado || mongoose.model<IFiadoDocument>('Fiado', FiadoSchema)