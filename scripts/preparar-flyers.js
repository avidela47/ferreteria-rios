/* eslint-disable @typescript-eslint/no-require-imports */
// Prepara los flyers para el sitio: los pasa a WebP liviano y los guarda en public/flyers.
// Despues de hacer commit y push, con --guardar se asigna cada flyer a la ficha de su producto.
//
// Cada archivo tiene que llamarse como el codigo del producto: 10023.png, ESTAÑO.png, etc.
//
// Paso 1:  node scripts/preparar-flyers.js            -> convierte y deja los WebP en public/flyers
// Paso 2:  git add -A, commit y push (el sitio se actualiza solo)
// Paso 3:  node scripts/preparar-flyers.js --guardar  -> asigna cada flyer a su producto en el catalogo
// Opciones: --carpeta "C:/Users/ARIEL/flyers/originales"  --ancho 900  --calidad 75  --solo CODIGO
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')

function arg(nombre, defecto) {
  const i = process.argv.indexOf('--' + nombre)
  if (i === -1 || i + 1 >= process.argv.length) return defecto
  return process.argv[i + 1]
}

const GUARDAR = process.argv.includes('--guardar')
const CARPETA = arg('carpeta', path.join(os.homedir(), 'flyers', 'originales'))
const ANCHO = Number(arg('ancho', '900'))
const CALIDAD = Number(arg('calidad', '75'))
const SOLO = arg('solo', null)
const DESTINO = path.join(process.cwd(), 'public', 'flyers')

function leerEnv() {
  const archivo = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(archivo)) {
    console.error('No encuentro .env.local en esta carpeta. Corre el script desde la raiz del proyecto.')
    process.exit(1)
  }
  for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*MONGODB_URI\s*=\s*(.*)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  console.error('No hay MONGODB_URI en .env.local')
  process.exit(1)
}

function nombreSeguro(codigo) {
  return String(codigo).trim().replace(/[^a-zA-Z0-9_-]/g, '_')
}

function mb(bytes) {
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function tamanoCarpeta(dir, omitir) {
  let total = 0
  if (!fs.existsSync(dir)) return 0
  for (const n of fs.readdirSync(dir)) {
    const ruta = path.join(dir, n)
    if (omitir && path.resolve(ruta) === path.resolve(omitir)) continue
    const st = fs.statSync(ruta)
    total += st.isDirectory() ? tamanoCarpeta(ruta, omitir) : st.size
  }
  return total
}

async function main() {
  await mongoose.connect(leerEnv())
  const db = mongoose.connection.db
  const productos = await db.collection('products').find({ activo: true }).toArray()
  const fichas = await db.collection('fichas').find({ activo: true }).toArray()

  const prodPorClave = {}
  const ambiguos = {}
  for (const p of productos) {
    const cod = String(p.codigo || '').trim()
    if (!cod) continue
    const k = nombreSeguro(cod).toLowerCase()
    if (prodPorClave[k]) ambiguos[k] = true
    prodPorClave[k] = p
  }
  const fichaPorCodigo = {}
  for (const f of fichas) {
    const cod = String(f.codigo || '').trim()
    if (cod) fichaPorCodigo[cod] = f
  }

  // ---------- Paso 3: asignar cada flyer a su ficha ----------
  if (GUARDAR) {
    if (!fs.existsSync(DESTINO)) {
      console.error('No existe public/flyers. Primero corre: node scripts/preparar-flyers.js')
      process.exit(1)
    }
    let guardados = 0
    const sinArchivo = []
    for (const p of productos) {
      const cod = String(p.codigo || '').trim()
      if (!cod) continue
      if (SOLO && nombreSeguro(SOLO).toLowerCase() !== nombreSeguro(cod).toLowerCase()) continue
      const nombre = nombreSeguro(cod) + '.webp'
      const ficha = fichaPorCodigo[cod]
      if (!fs.existsSync(path.join(DESTINO, nombre)) || !ficha) {
        sinArchivo.push(cod)
        continue
      }
      await db.collection('fichas').updateOne({ _id: ficha._id }, { $set: { imagen: '/flyers/' + nombre } })
      guardados++
    }
    console.log('')
    console.log('Flyers asignados a su ficha: ' + guardados)
    if (sinArchivo.length) console.log('Productos sin flyer o sin ficha (no se tocaron): ' + sinArchivo.length + (sinArchivo.length <= 15 ? ' -> ' + sinArchivo.join(', ') : ''))
    console.log('Recarga el catalogo para verlos (el sitio tiene que haber terminado de actualizarse).')
    await mongoose.disconnect()
    return
  }

  // ---------- Paso 1: convertir a WebP ----------
  if (!fs.existsSync(CARPETA)) {
    console.error('No existe la carpeta ' + CARPETA + '. Usa --carpeta "ruta".')
    process.exit(1)
  }
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('Falta la libreria sharp. Instalala sin tocar package.json con: npm i --no-save sharp')
    process.exit(1)
  }
  const archivos = fs
    .readdirSync(CARPETA)
    .filter(function (n) { return /\.(png|jpe?g|webp)$/i.test(n) })
    .map(function (n) {
      const ruta = path.join(CARPETA, n)
      const st = fs.statSync(ruta)
      return { nombre: n, base: n.replace(/\.[^.]+$/, '').trim(), ruta: ruta, tam: st.size, fecha: st.mtimeMs }
    })
  if (!archivos.length) {
    console.error('No hay imagenes PNG, JPG o WebP en ' + CARPETA)
    process.exit(1)
  }
  fs.mkdirSync(DESTINO, { recursive: true })

  const elegidos = {}
  const problemas = []
  for (const a of archivos) {
    const k = nombreSeguro(a.base).toLowerCase()
    const p = prodPorClave[k]
    if (!p) {
      problemas.push('SIN PRODUCTO: ' + a.nombre)
      continue
    }
    if (ambiguos[k]) {
      problemas.push('CODIGO AMBIGUO: ' + a.nombre)
      continue
    }
    const cod = String(p.codigo).trim()
    if (SOLO && nombreSeguro(SOLO).toLowerCase() !== k) continue
    if (elegidos[cod]) {
      if (a.fecha > elegidos[cod].fecha) {
        problemas.push('REPETIDO (se usa el mas nuevo): ' + elegidos[cod].nombre)
        elegidos[cod] = a
      } else {
        problemas.push('REPETIDO (se usa el mas nuevo): ' + a.nombre)
      }
      continue
    }
    elegidos[cod] = a
  }

  let origTotal = 0
  let webTotal = 0
  let hechos = 0
  for (const cod of Object.keys(elegidos)) {
    const a = elegidos[cod]
    try {
      const buf = await sharp(a.ruta).rotate().resize({ width: ANCHO, withoutEnlargement: true }).webp({ quality: CALIDAD }).toBuffer()
      fs.writeFileSync(path.join(DESTINO, nombreSeguro(cod) + '.webp'), buf)
      origTotal += a.tam
      webTotal += buf.length
      hechos++
      if (hechos % 100 === 0) console.log('  ... ' + hechos + ' convertidas')
    } catch (e) {
      problemas.push('NO SE PUDO CONVERTIR: ' + a.nombre + ' (' + e.message + ')')
    }
  }
  const sinFlyer = productos.filter(function (p) {
    const cod = String(p.codigo || '').trim()
    return cod && !elegidos[cod] && !SOLO
  })

  const resto = tamanoCarpeta(path.join(process.cwd(), 'public'), DESTINO)
  const totalFlyers = tamanoCarpeta(DESTINO)
  console.log('')
  console.log('Flyers convertidos a WebP: ' + hechos + ' | antes ' + mb(origTotal) + ' -> ahora ' + mb(webTotal))
  console.log('public/flyers pesa ' + mb(totalFlyers) + ' | el resto de public pesa ' + mb(resto) + ' | total ' + mb(totalFlyers + resto))
  if (totalFlyers + resto > 85 * 1048576) {
    console.log('ATENCION: Vercel Hobby acepta hasta 100 MB de archivos estaticos. Bajá el peso con --ancho 800 --calidad 70.')
  }
  console.log('Productos activos sin flyer: ' + sinFlyer.length + (sinFlyer.length && sinFlyer.length <= 15 ? ' -> ' + sinFlyer.map(function (p) { return p.codigo }).join(', ') : ''))
  if (problemas.length) {
    console.log('Avisos:')
    for (const t of problemas.slice(0, 30)) console.log('  ' + t)
  }
  console.log('')
  console.log('Siguiente: hacer commit y push, esperar que el sitio termine de actualizarse y correr: node scripts/preparar-flyers.js --guardar')
  await mongoose.disconnect()
}

main().catch(function (e) {
  console.error('Error:', e.message)
  process.exit(1)
})