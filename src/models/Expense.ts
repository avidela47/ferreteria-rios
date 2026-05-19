import mongoose, { Schema, Document } from 'mongoose'
import { CategoriaGasto } from '@/types'

export interface IExpenseDocument extends Document {
  descripcion: string
  categoria: CategoriaGasto
  monto: number
  fecha: Date
  comprobante: string
  recurrente: boolean
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    descripcion: { type: String, required: true, trim: true },
    categoria: {
      type: String,
      enum: ['alquiler', 'servicios', 'flete', 'impuestos', 'sueldos', 'mantenimiento', 'otros'],
      required: true,
    },
    monto: { type: Number, required: true },
    fecha: { type: Date, required: true, default: Date.now },
    comprobante: { type: String, default: '' },
    recurrente: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Expense ||
  mongoose.model<IExpenseDocument>('Expense', ExpenseSchema)