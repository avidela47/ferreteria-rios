// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')

const MONGODB_URI = 'mongodb+srv://avidela47:avupk014@cluster0.9herq1s.mongodb.net/ferreteria-rios'

const FichaSchema = new mongoose.Schema({
  id_ficha: String,
  nombre: String,
  codigo: { type: String, default: '' },
  categoria: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  paraQueSirve: { type: String, default: '' },
  quienLoPide: { type: String, default: '' },
  comoSeUsa: { type: String, default: '' },
  ventaCruzada: { type: [String], default: [] },
  datosClave: { type: String, default: '' },
  formaApariencia: { type: String, default: '' },
  activo: { type: Boolean, default: true },
}, { timestamps: true })

const Ficha = mongoose.model('Ficha', FichaSchema)

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado a MongoDB')

  await Ficha.deleteMany({})
  console.log('Fichas anteriores eliminadas')

  const fichas = JSON.parse(fs.readFileSync('./src/data/catalogo.json', 'utf-8'))

  const docs = fichas.map(f => ({
    id_ficha: f.id,
    nombre: f.nombre,
    codigo: f.codigo ?? '',
    categoria: f.categoria ?? '',
    descripcion: f.descripcion ?? '',
    paraQueSirve: f.paraQueSirve ?? '',
    quienLoPide: f.quienLoPide ?? '',
    comoSeUsa: f.comoSeUsa ?? '',
    ventaCruzada: f.ventaCruzada ?? [],
    datosClave: f.datosClave ?? '',
    formaApariencia: f.formaApariencia ?? '',
    activo: true,
  }))

  const resultado = await Ficha.insertMany(docs)
  console.log(`Cargadas: ${resultado.length} fichas`)

  await mongoose.disconnect()
  console.log('Listo')
}

main().catch(console.error)