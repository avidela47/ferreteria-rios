import mongoose, { Schema, Document } from 'mongoose'

export interface ICategoryDocument extends Document {
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    nombre: { type: String, required: true, trim: true, unique: true },
    descripcion: { type: String, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Category ||
  mongoose.model<ICategoryDocument>('Category', CategorySchema)