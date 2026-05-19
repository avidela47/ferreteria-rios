import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplierDocument extends Document {
  nombre: string
  telefono: string
  email: string
  direccion: string
  cuit: string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    direccion: { type: String, default: '' },
    cuit: { type: String, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Supplier ||
  mongoose.model<ISupplierDocument>('Supplier', SupplierSchema)