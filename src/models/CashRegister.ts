import mongoose, { Schema, Document } from 'mongoose'

export interface ICashRegisterDocument extends Document {
  fecha: string
  montoInicial: number
  usuarioApertura: string
  horaApertura: Date
  estado: 'abierta' | 'cerrada'
  efectivoVentas: number
  otrosVentas: number
  efectivoFinal: number
  otrosFinal: number
  usuarioCierre: string
  horaCierre: Date | null
  nota: string
  createdAt: Date
  updatedAt: Date
}

const CashRegisterSchema = new Schema<ICashRegisterDocument>(
  {
    fecha: { type: String, required: true },
    montoInicial: { type: Number, required: true, default: 0 },
    usuarioApertura: { type: String, default: '' },
    horaApertura: { type: Date, default: Date.now },
    estado: { type: String, enum: ['abierta', 'cerrada'], default: 'abierta' },
    efectivoVentas: { type: Number, default: 0 },
    otrosVentas: { type: Number, default: 0 },
    efectivoFinal: { type: Number, default: 0 },
    otrosFinal: { type: Number, default: 0 },
    usuarioCierre: { type: String, default: '' },
    horaCierre: { type: Date, default: null },
    nota: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.CashRegister ||
  mongoose.model<ICashRegisterDocument>('CashRegister', CashRegisterSchema)