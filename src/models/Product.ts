import mongoose, { Schema, Document } from 'mongoose'

export interface IProductDocument extends Document {
  nombre: string
  categoria: mongoose.Types.ObjectId
  cantidad: number
  stockMinimo: number
  unidad: string
  precioCosto: number
  precioVenta: number
  margen: number
  proveedor: mongoose.Types.ObjectId
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProductDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    categoria: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    cantidad: { type: Number, required: true, default: 0 },
    stockMinimo: { type: Number, default: 5 },
    unidad: { type: String, default: 'u.' },
    precioCosto: { type: Number, required: true },
    precioVenta: { type: Number, required: true },
    margen: { type: Number, default: 0 },
    proveedor: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null, required: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Product ||
  mongoose.model<IProductDocument>('Product', ProductSchema)