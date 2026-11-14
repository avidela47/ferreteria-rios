/* eslint-disable @typescript-eslint/no-require-imports */
// Compara los precios de hoy contra los del analisis del 28/10 (analisis-margenes.csv).
// SOLO LEE la base, no modifica nada.
// Uso: node scripts/comparar-precios.js
// Opciones: --antes "C:/ruta/analisis-margenes.csv"  --gastos 569694  --desde 2026-10-01  --hasta 2026-10-28
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')

function arg(nombre, defecto) {
  const i = process.argv.indexOf('--' + nombre)
  if (i === -1 || i + 1 >= process.argv.length) return defecto
  return process.argv[i + 1]
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

// Lee un CSV con separador ; y comillas
function leerCsv(archivo) {
  let texto = fs.readFileSync(archivo, 'utf8')
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1)
  const filas = []
  let fila = []
  let campo = ''
  let entre = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entre) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else entre = false
      } else campo += c
    } else if (c === '"') entre = true
    else if (c === ';') {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo)
      campo = ''
      if (fila.length > 1 || fila[0] !== '') filas.push(fila)
      fila = []
    } else campo += c
  }
  if (campo !== '' || fila.length) {
    fila.push(campo)
    filas.push(fila)
  }
  return filas
}

function decimal(t) {
  if (t === undefined || t === null || String(t).trim() === '') return null
  const n = Number(String(t).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function pesos(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

function pct(n) {
  return (n * 100).toFixed(1) + '%'
}

function num(n, dec) {
  return Number(n).toFixed(dec === undefined ? 0 : dec).replace('.', ',')
}

function csv(t) {
  return '"' + String(t).replace(/"/g, '""') + '"'
}

async function main() {
  const archivoAntes = arg('antes', path.join(os.homedir(), 'analisis-margenes.csv'))
  const gastos = Number(arg('gastos', '569694'))
  const desde = new Date(arg('desde', '2026-10-01') + 'T03:00:00Z')
  const hasta = new Date(new Date(arg('hasta', '2026-10-28') + 'T03:00:00Z').getTime() + 24 * 3600 * 1000)

  if (!fs.existsSync(archivoAntes)) {
    console.error('No encuentro ' + archivoAntes + ' (el CSV del analisis del 28/10). Usa --antes "ruta".')
    process.exit(1)
  }

  const tabla = leerCsv(archivoAntes)
  const cab = tabla[0]
  const ix = function (n) { return cab.indexOf(n) }
  const iCod = ix('codigo')
  const iNom = ix('nombre')
  const iPre = ix('precio actual')
  const iCos = ix('costo actual')
  const iSug = ix('precio sugerido')
  const iUni = ix('unidades vendidas')
  if ([iCod, iNom, iPre, iCos, iSug, iUni].some(function (i) { return i < 0 })) {
    console.error('El CSV no tiene las columnas esperadas. Tiene que ser el analisis-margenes.csv del 28/10.')
    process.exit(1)
  }
  const antes = {}
  for (const f of tabla.slice(1)) {
    const cod = String(f[iCod] || '').trim()
    if (!cod) continue
    antes[cod] = {
      nombre: f[iNom],
      precio: decimal(f[iPre]),
      costo: decimal(f[iCos]),
      sugerido: decimal(f[iSug]),
      unidades: decimal(f[iUni]) || 0,
    }
  }

  await mongoose.connect(leerEnv())
  const db = mongoose.connection.db
  const productos = await db.collection('products').find({ activo: { $ne: false } }).toArray()

  const porProducto = await db
    .collection('sales')
    .aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: desde, $lte: hasta } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          unidades: { $sum: '$items.cantidad' },
          venta: { $sum: '$items.subtotal' },
          costo: { $sum: { $multiply: ['$items.cantidad', '$items.precioCosto'] } },
        },
      },
    ])
    .toArray()
  const ventasPorId = {}
  for (const v of porProducto) ventasPorId[String(v._id)] = v

  const filas = []
  let nuevos = 0
  const vistos = {}
  for (const p of productos) {
    const cod = String(p.codigo || '').trim()
    const a = antes[cod]
    if (!cod || !a) {
      nuevos++
      continue
    }
    vistos[cod] = true
    const ahora = Number(p.precioVenta) || 0
    const costoAhora = Number(p.precioCosto) || 0
    const cambio = Math.abs(ahora - a.precio) > 0.5
    const estabaEnPropuesta = a.sugerido !== null && a.unidades > 0
    if (!cambio && !estabaEnPropuesta) continue
    const margenAntes = a.precio > 0 && a.costo > 0 ? (a.precio - a.costo) / a.precio : null
    const margenAhora = ahora > 0 && costoAhora > 0 ? (ahora - costoAhora) / ahora : null
    const notas = []
    if (cambio && ahora < a.precio) notas.push('BAJO de precio')
    if (a.costo !== null && Math.abs(costoAhora - a.costo) > 0.5) notas.push('cambio el costo (antes ' + Math.round(a.costo) + ')')
    if (!cambio) notas.push('estaba en la propuesta y no cambio')
    filas.push({
      estado: cambio ? 'CAMBIADO' : 'SIN CAMBIO',
      codigo: cod,
      nombre: String(p.nombre).replace(/\s+/g, ' ').trim(),
      antes: a.precio,
      ahora: ahora,
      aumento: a.precio > 0 ? ahora / a.precio - 1 : null,
      costo: costoAhora,
      margenAntes: margenAntes,
      margenAhora: margenAhora,
      llega: margenAhora !== null && margenAhora >= 0.4995,
      sugerido: a.sugerido,
      unidades: a.unidades,
      nota: notas.join('; '),
    })
  }
  const faltan = Object.keys(antes).filter(function (c) { return !vistos[c] }).length

  filas.sort(function (x, y) {
    if (x.estado !== y.estado) return x.estado === 'CAMBIADO' ? -1 : 1
    return x.nombre.localeCompare(y.nombre, 'es')
  })

  const cambiados = filas.filter(function (f) { return f.estado === 'CAMBIADO' })
  const sinCambio = filas.filter(function (f) { return f.estado === 'SIN CAMBIO' })

  // ---------- CSV ----------
  const cabOut = [
    'estado', 'codigo', 'nombre', 'precio anterior', 'precio nuevo', 'aumento %', 'costo actual',
    'margen anterior %', 'margen nuevo %', 'llega al 50%', 'precio para 50%', 'unidades vendidas oct', 'nota',
  ]
  const lineas = [cabOut.join(';')]
  for (const f of filas) {
    lineas.push([
      f.estado,
      csv(f.codigo),
      csv(f.nombre),
      num(f.antes, 0),
      num(f.ahora, 0),
      f.aumento === null ? '' : num(f.aumento * 100, 1),
      num(f.costo, 0),
      f.margenAntes === null ? '' : num(f.margenAntes * 100, 1),
      f.margenAhora === null ? '' : num(f.margenAhora * 100, 1),
      f.llega ? 'SI' : 'NO',
      f.sugerido === null ? '' : num(f.sugerido, 0),
      num(f.unidades, 0),
      csv(f.nota),
    ].join(';'))
  }
  const salida = path.join(os.homedir(), 'precios-cambiados.csv')
  fs.writeFileSync(salida, '\uFEFF' + lineas.join('\r\n'), 'utf8')

  // ---------- Proyeccion con las ventas de octubre ----------
  const precioPorId = {}
  for (const p of productos) precioPorId[String(p._id)] = Number(p.precioVenta) || 0
  const cambiadoPorId = {}
  for (const p of productos) {
    const a = antes[String(p.codigo || '').trim()]
    if (a && Math.abs((Number(p.precioVenta) || 0) - a.precio) > 0.5) cambiadoPorId[String(p._id)] = true
  }
  let V0 = 0
  let C0 = 0
  let V1 = 0
  let V2 = 0
  let C2 = 0
  for (const id of Object.keys(ventasPorId)) {
    const v = ventasPorId[id]
    const pn = precioPorId[id]
    V0 += v.venta
    C0 += v.costo
    const nuevo = pn > 0 ? v.unidades * pn : v.venta
    V1 += nuevo
    const perdidas = cambiadoPorId[id] ? 0.85 : 1
    V2 += nuevo * perdidas
    C2 += v.costo * perdidas
  }
  const m0 = V0 ? 1 - C0 / V0 : 0
  const m1 = V1 ? 1 - C0 / V1 : 0
  const m2 = V2 ? 1 - C2 / V2 : 0

  console.log('')
  console.log('Productos con precio CAMBIADO: ' + cambiados.length)
  const subieron = cambiados.filter(function (f) { return f.ahora > f.antes })
  const bajaron = cambiados.filter(function (f) { return f.ahora < f.antes })
  if (subieron.length) {
    const prom = subieron.reduce(function (s, f) { return s + f.aumento }, 0) / subieron.length
    console.log('  Subieron: ' + subieron.length + ' (aumento promedio ' + pct(prom) + ')')
  }
  if (bajaron.length) console.log('  BAJARON: ' + bajaron.length + ' (revisar la columna nota del archivo)')
  console.log('  De esos, llegan al 50% de margen: ' + cambiados.filter(function (f) { return f.llega }).length + ' | quedan por debajo: ' + cambiados.filter(function (f) { return !f.llega }).length)
  console.log('Estaban en la propuesta y NO cambiaron: ' + sinCambio.length)
  console.log('Productos nuevos desde el 28/10 (no comparados): ' + nuevos + ' | del CSV que ya no estan: ' + faltan)
  console.log('')
  console.log('Con las ventas de octubre (' + desde.toISOString().slice(0, 10) + ' al ' + new Date(hasta.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10) + ') a los precios de hoy:')
  console.log('  Antes:  ventas ' + pesos(V0) + ' | margen ' + pct(m0) + ' | resultado ' + pesos(V0 - C0 - gastos))
  console.log('  Ahora (mismas unidades): ventas ' + pesos(V1) + ' | margen ' + pct(m1) + ' | resultado ' + pesos(V1 - C0 - gastos) + ' | equilibrio ' + pesos(gastos / m1))
  console.log('  Ahora (perdiendo 15% de unidades en los cambiados): margen ' + pct(m2) + ' | resultado ' + pesos(V2 - C2 - gastos) + ' | equilibrio ' + pesos(gastos / m2))
  console.log('')
  console.log('Archivo: ' + salida)
  await mongoose.disconnect()
}

main().catch(function (e) {
  console.error('Error:', e.message)
  process.exit(1)
})