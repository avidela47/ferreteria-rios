const mongoose = require('mongoose')
const fs = require('fs')

const MONGODB_URI = 'mongodb+srv://avidela47:avupk014@cluster0.9herq1s.mongodb.net/ferreteria-rios'

const SupplierSchema = new mongoose.Schema({
  nombre: String,
  telefono: { type: String, default: '' },
  email: { type: String, default: '' },
  direccion: { type: String, default: '' },
  cuit: { type: String, default: '' },
  activo: { type: Boolean, default: true },
}, { timestamps: true })

const QuoteItemSchema = new mongoose.Schema({
  codigo: { type: String, default: '' },
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  nuevo: { type: Boolean, default: false },
}, { _id: false })

const QuoteRequestSchema = new mongoose.Schema({
  numero: Number,
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  items: [QuoteItemSchema],
  nota: { type: String, default: '' },
}, { timestamps: true })

const Supplier = mongoose.model('Supplier', SupplierSchema)
const QuoteRequest = mongoose.model('QuoteRequest', QuoteRequestSchema)

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado a MongoDB')

  let proveedor = await Supplier.findOne({ nombre: { $regex: /lalo\s*gas/i } })

  if (!proveedor) {
    proveedor = await Supplier.create({ nombre: 'Lalo Gas', activo: true })
    console.log('Proveedor Lalo Gas creado')
  } else {
    console.log('Proveedor encontrado: ' + proveedor.nombre)
  }

  const filas = JSON.parse(fs.readFileSync('./items_lalo.json', 'utf-8'))

  const items = filas.map(function (fila) {
    return {
      codigo: fila[0],
      descripcion: fila[1],
      cantidad: 1,
      nuevo: true,
    }
  })

  const ultimo = await QuoteRequest.findOne().sort({ numero: -1 })
  const numero = ultimo ? ultimo.numero + 1 : 1

  const pedido = await QuoteRequest.create({
    numero: numero,
    proveedor: proveedor._id,
    items: items,
    nota: '',
  })

  console.log('Pedido de presupuesto creado. Numero: ' + numero + '. Items: ' + items.length)
  console.log('ID del pedido: ' + pedido._id)

  await mongoose.disconnect()
  console.log('Listo')
}

main().catch(console.error)