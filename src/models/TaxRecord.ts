import mongoose, { Schema, Document } from 'mongoose'
import { TipoImpuesto } from '@/types'

export interface ITaxRecordDocument extends Document {
  tipo: TipoImpuesto
  periodo: string
  monto: number
  vencimiento: Date
  pagado: boolean
  comprobante: string
  nota: string
  createdAt: Date
  updatedAt: Date
}

const TaxRecordSchema = new Schema<ITaxRecordDocument>(
  {
    tipo: {
      type: String,
      enum: ['IVA', 'IIBB', 'monotributo', 'municipal', 'otro'],
      required: true,
    },
    periodo: { type: String, required: true, trim: true },
    monto: { type: Number, required: true },
    vencimiento: { type: Date, required: true },
    pagado: { type: Boolean, default: false },
    comprobante: { type: String, default: '' },
    nota: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.TaxRecord ||
  mongoose.model<ITaxRecordDocument>('TaxRecord', TaxRecordSchema)