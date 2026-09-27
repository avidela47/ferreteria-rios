import mongoose, { Schema, Document } from 'mongoose'

export interface IFichaDocument extends Document {
  id_ficha: string
  nombre: string
  codigo: string
  imagen: string
  categoria: string
  descripcion: string
  paraQueSirve: string
  quienLoPide: string
  comoSeUsa: string
  ventaCruzada: string[]
  datosClave: string
  formaApariencia: string
  activo: boolean
  fuentes: { titulo: string; url: string }[]
}

const FichaSchema = new Schema<IFichaDocument>(
  {
    id_ficha: { type: String },
    nombre: { type: String, required: true },
    codigo: { type: String, default: '' },
    imagen: { type: String, default: '' },
    categoria: { type: String, default: '' },
    descripcion: { type: String, default: '' },
    paraQueSirve: { type: String, default: '' },
    quienLoPide: { type: String, default: '' },
    comoSeUsa: { type: String, default: '' },
    ventaCruzada: { type: [String], default: [] },
    datosClave: { type: String, default: '' },
    formaApariencia: { type: String, default: '' },
    activo: { type: Boolean, default: true },
    fuentes: { type: [{ titulo: String, url: String, _id: false }], default: [] },
  },
  { timestamps: true }
)

export default mongoose.models.Ficha ||
  mongoose.model<IFichaDocument>('Ficha', FichaSchema)
