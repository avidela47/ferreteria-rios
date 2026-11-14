/* eslint-disable @typescript-eslint/no-require-imports */
// Exporta las fichas del catalogo y mide cuantas tienen texto generico (de relleno).
// SOLO LEE la base, no modifica nada.
// Uso: node scripts/exportar-fichas.js
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')

const GENERICOS = {
  paraQueSirve: 'Consultar con el vendedor para el uso específico.',
  quienLoPide: 'Cliente que lo solicita específicamente.',
  comoSeUsa: 'Seguir las instrucciones del fabricante.',
  datosClave: 'Verificar compatibilidad antes de comprar.',
  formaApariencia: 'Ver producto en góndola.',
}

function leerEnv() {
  const archivo = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(archivo)) {
    console.error('No encuentro .env.local en esta carpeta. Corre el script desde la raiz del proyecto.')
    process.exit(1)
  }
  const texto = fs.readFileSync(archivo, 'utf8')
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*MONGODB_URI\s*=\s*(.*)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  console.error('No hay MONGODB_URI en .env.local')
  process.exit(1)
}

function limpio(t) {
  return String(t === undefined || t === null ? '' : t).replace(/\s+/g, ' ').trim()
}

async function main() {
  await mongoose.connect(leerEnv())
  const db = mongoose.connection.db
  const productos = await db.collection('products').find({ activo: true }).toArray()
  const fichas = await db.collection('fichas').find({ activo: true }).toArray()
  const categorias = await db.collection('categories').find({}).toArray()
  const catPorId = {}
  for (const c of categorias) catPorId[String(c._id)] = c.nombre
  const fichaPorCodigo = {}
  for (const f of fichas) {
    const cod = limpio(f.codigo)
    if (cod) fichaPorCodigo[cod] = f
  }

  // Cuantas veces se repite cada "para que sirve" (indicador de texto de plantilla)
  const repeticiones = {}
  for (const f of fichas) {
    const t = limpio(f.paraQueSirve)
    if (t) repeticiones[t] = (repeticiones[t] || 0) + 1
  }

  const salida = []
  let sinFicha = 0
  let genericas = 0
  let parciales = 0
  let reales = 0
  let plantilla = 0
  for (const p of productos) {
    const cod = limpio(p.codigo)
    const f = fichaPorCodigo[cod]
    const item = {
      codigo: cod,
      nombre: limpio(p.nombre),
      categoria: p.categoria ? catPorId[String(p.categoria)] || '' : '',
      precioVenta: Number(p.precioVenta) || 0,
      unidad: limpio(p.unidad),
      estado: '',
      descripcion: '',
      paraQueSirve: '',
      quienLoPide: '',
      comoSeUsa: '',
      datosClave: '',
      formaApariencia: '',
      ventaCruzada: [],
    }
    if (!f) {
      item.estado = 'SIN FICHA'
      sinFicha++
    } else {
      let marcas = 0
      for (const campo of Object.keys(GENERICOS)) if (limpio(f[campo]) === GENERICOS[campo]) marcas++
      item.estado = marcas >= 3 ? 'GENERICA' : marcas >= 1 ? 'PARCIAL' : 'REAL'
      if (item.estado === 'GENERICA') genericas++
      else if (item.estado === 'PARCIAL') parciales++
      else reales++
      if ((repeticiones[limpio(f.paraQueSirve)] || 0) >= 5 && item.estado !== 'GENERICA') plantilla++
      item.descripcion = limpio(f.descripcion)
      item.paraQueSirve = limpio(f.paraQueSirve)
      item.quienLoPide = limpio(f.quienLoPide)
      item.comoSeUsa = limpio(f.comoSeUsa)
      item.datosClave = limpio(f.datosClave)
      item.formaApariencia = limpio(f.formaApariencia)
      item.ventaCruzada = Array.isArray(f.ventaCruzada) ? f.ventaCruzada.map(limpio) : []
    }
    salida.push(item)
  }
  salida.sort(function (a, b) { return a.categoria.localeCompare(b.categoria, 'es') || a.nombre.localeCompare(b.nombre, 'es') })

  const archivo = path.join(os.homedir(), 'fichas-export.json')
  fs.writeFileSync(archivo, JSON.stringify(salida, null, 1), 'utf8')

  console.log('')
  console.log('Productos activos: ' + productos.length)
  console.log('  Sin ficha: ' + sinFicha)
  console.log('  Ficha GENERICA (texto de relleno, ej. "Consultar con el vendedor"): ' + genericas)
  console.log('  Ficha PARCIAL (algun campo de relleno): ' + parciales)
  console.log('  Ficha con texto propio: ' + reales + ' (de esas, ' + plantilla + ' comparten el mismo "para que sirve" con otras 4 o mas)')
  console.log('')
  console.log('Archivo: ' + archivo)
  await mongoose.disconnect()
}

main().catch(function (e) {
  console.error('Error:', e.message)
  process.exit(1)
})