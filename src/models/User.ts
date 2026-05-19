import mongoose, { Schema, Document } from 'mongoose'
import { UserRole } from '@/types'

export interface IUserDocument extends Document {
  nombre: string
  email: string
  password: string
  rol: UserRole
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['admin', 'vendedor'], default: 'vendedor' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.User ||
  mongoose.model<IUserDocument>('User', UserSchema)