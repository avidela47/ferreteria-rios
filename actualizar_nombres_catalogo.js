const mongoose = require('mongoose')
const fs = require('fs')

const MONGODB_URI = 'mongodb+srv://avidela47:avupk014@cluster0.9herq1s.mongodb.net/ferreteria-rios'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado a MongoDB')

  const db = mongoose.connection
  const pares = JSON.parse(fs.readFileSync('./nombres_actualizados.json', 'utf-8'))

  let actualizados = 0
  let sinMatch = []

  for (const par of pares) {
    const codigo = par[0]
    const nombreNuevo = par[1]

    const resultado = await db.collection('fichas').updateOne(
      { codigo: codigo },
      { $set: { nombre: nombreNuevo } }
    )

    if (resultado.matchedCount > 0) {
      actualizados++
    } else {
      sinMatch.push(codigo)
    }
  }

  console.log('Actualizados: ' + actualizados + ' de ' + pares.length)
  console.log('Sin match en catalogo: ' + sinMatch.length)
  if (sinMatch.length > 0) {
    console.log('Codigos sin match: ' + sinMatch.join(', '))
  }

  await mongoose.disconnect()
  console.log('Listo')
}

main().catch(console.error)