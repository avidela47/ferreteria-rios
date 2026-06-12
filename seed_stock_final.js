// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')

const MONGODB_URI = 'mongodb+srv://avidela47:avupk014@cluster0.9herq1s.mongodb.net/ferreteria-rios'

const ProductSchema = new mongoose.Schema({
  nombre: String,
  codigo: String,
  descripcion: String,
  precioCosto: Number,
  precioVenta: Number,
  margen: Number,
  cantidad: Number,
  stockMinimo: Number,
  unidad: String,
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  activo: { type: Boolean, default: true },
}, { timestamps: true })

const Product = mongoose.model('Product', ProductSchema)

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado a MongoDB')

  // Limpiar productos anteriores
  const eliminados = await Product.deleteMany({})
  console.log(`Eliminados: ${eliminados.deletedCount} productos`)

  // Cargar nuevos
  const productos = JSON.parse(fs.readFileSync('./productos_seed.json', 'utf-8'))
  
  const resultado = await Product.insertMany(productos)
  console.log(`Cargados: ${resultado.length} productos`)

  await mongoose.disconnect()
  console.log('Listo')
}

main().catch(console.error)