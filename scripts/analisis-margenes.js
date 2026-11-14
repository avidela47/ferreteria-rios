/* eslint-disable @typescript-eslint/no-require-imports */
// Analisis de margenes: que productos conviene subir para llegar a un margen objetivo.
// SOLO LEE la base, no modifica nada.
// Uso: node scripts/analisis-margenes.js --gastos 569694
// Opciones: --objetivo 50  --perdida 15  --desde 2026-10-01  --hasta 2026-10-28
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

// Sube el precio al proximo multiplo "lindo": 10 (hasta 1.000), 50 (hasta 10.000), 100 (mas)
function redondear(p) {
  const paso = p < 1000 ? 10 : p < 10000 ? 50 : 100
  return Math.ceil(p / paso) * paso
}

async function main() {
  const objetivo = Number(arg('objetivo', '50')) / 100
  const perdida = Number(arg('perdida', '15')) / 100
  const gastosTxt = arg('gastos', null)
  const gastos = gastosTxt ? Number(gastosTxt) : null

  if (!(objetivo > 0.05 && objetivo < 0.9)) {
    console.error('--objetivo tiene que estar entre 5 y 90')
    process.exit(1)
  }

  // Hora Argentina = UTC-3. Por defecto: desde el dia 1 del mes en curso hasta ahora.
  const ahoraAR = new Date(Date.now() - 3 * 3600 * 1000)
  const desdeTxt = arg('desde', null)
  const hastaTxt = arg('hasta', null)
  const desde = desdeTxt
    ? new Date(desdeTxt + 'T03:00:00Z')
    : new Date(Date.UTC(ahoraAR.getUTCFullYear(), ahoraAR.getUTCMonth(), 1, 3, 0, 0))
  const hasta = hastaTxt
    ? new Date(new Date(hastaTxt + 'T03:00:00Z').getTime() + 24 * 3600 * 1000)
    : new Date()

  await mongoose.connect(leerEnv())
  const db = mongoose.connection.db

  const filtro = { estado: 'completada', createdAt: { $gte: desde, $lte: hasta } }

  const totales = await db
    .collection('sales')
    .aggregate([
      { $match: filtro },
      { $group: { _id: null, total: { $sum: '$total' }, ganancia: { $sum: '$ganancia' }, cantidad: { $sum: 1 } } },
    ])
    .toArray()

  const porProducto = await db
    .collection('sales')
    .aggregate([
      { $match: filtro },
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

  const productos = await db.collection('products').find({ activo: { $ne: false } }).toArray()
  const categorias = await db.collection('categories').find({}).toArray()

  const catPorId = {}
  for (const c of categorias) catPorId[String(c._id)] = c.nombre
  const ventasPorProd = {}
  for (const v of porProducto) ventasPorProd[String(v._id)] = v

  const V = totales.length ? totales[0].total : 0
  const G = totales.length ? totales[0].ganancia : 0
  const nVentas = totales.length ? totales[0].cantidad : 0

  const filas = []
  for (const p of productos) {
    const v = ventasPorProd[String(p._id)] || { unidades: 0, venta: 0, costo: 0 }
    const pc = Number(p.precioCosto) || 0
    const pv = Number(p.precioVenta) || 0
    const fila = {
      codigo: String(p.codigo || '').trim(),
      nombre: String(p.nombre).replace(/\s+/g, ' ').trim(),
      categoria: p.categoria ? catPorId[String(p.categoria)] || '' : '',
      unidades: v.unidades,
      venta: v.venta,
      costo: pc,
      precio: pv,
      margen: null,
      recargo: null,
      sugerido: null,
      margenNuevo: null,
      aumento: null,
      extra0: 0,
      extraP: 0,
      dR0: 0,
      dG0: 0,
      dRP: 0,
      dGP: 0,
      nota: '',
    }
    if (pc <= 0 || pv <= 0) {
      fila.nota = 'REVISAR costo o precio en 0'
      filas.push(fila)
      continue
    }
    fila.margen = (pv - pc) / pv
    fila.recargo = (pv - pc) / pc
    if (fila.margen < objetivo - 0.0005) {
      const pn = redondear(pc / (1 - objetivo))
      if (pn > pv) {
        fila.sugerido = pn
        fila.margenNuevo = (pn - pc) / pn
        fila.aumento = pn / pv - 1
        const u = v.unidades
        const c0 = u > 0 ? v.costo / u : pc
        const g0 = v.venta - v.costo
        const calc = function (frac) {
          const u2 = u * (1 - frac)
          const r1 = u2 * pn
          const g1 = r1 - u2 * c0
          return { dR: r1 - v.venta, dG: g1 - g0 }
        }
        const a = calc(0)
        const b = calc(perdida)
        fila.dR0 = a.dR
        fila.dG0 = a.dG
        fila.dRP = b.dR
        fila.dGP = b.dG
        fila.extra0 = a.dG
        fila.extraP = b.dG
      }
    }
    if (v.unidades === 0 && fila.sugerido) fila.nota = 'sin ventas en el periodo'
    filas.push(fila)
  }

  filas.sort(function (a, b) {
    if (b.extra0 !== a.extra0) return b.extra0 - a.extra0
    return a.nombre.localeCompare(b.nombre, 'es')
  })

  // ---------- CSV ----------
  const cab = [
    'aplicar (SI/NO)', 'codigo', 'nombre', 'categoria', 'unidades vendidas', 'venta del periodo',
    'costo actual', 'precio actual', 'margen actual %', 'recargo actual %', 'precio sugerido',
    'margen nuevo %', 'aumento %', 'ganancia extra (mismas unidades)', 'ganancia extra (perdiendo ' + Math.round(perdida * 100) + '% de unidades)', 'nota',
  ]
  const lineas = [cab.join(';')]
  for (const f of filas) {
    lineas.push([
      '',
      csv(f.codigo),
      csv(f.nombre),
      csv(f.categoria),
      num(f.unidades, 0),
      num(f.venta, 0),
      num(f.costo, 0),
      num(f.precio, 0),
      f.margen === null ? '' : num(f.margen * 100, 1),
      f.recargo === null ? '' : num(f.recargo * 100, 1),
      f.sugerido === null ? '' : num(f.sugerido, 0),
      f.margenNuevo === null ? '' : num(f.margenNuevo * 100, 1),
      f.aumento === null ? '' : num(f.aumento * 100, 1),
      f.sugerido === null ? '' : num(f.extra0, 0),
      f.sugerido === null ? '' : num(f.extraP, 0),
      csv(f.nota),
    ].join(';'))
  }
  const salida = path.join(os.homedir(), 'analisis-margenes.csv')
  fs.writeFileSync(salida, '\uFEFF' + lineas.join('\r\n'), 'utf8')

  // ---------- Resumen en pantalla ----------
  const conSug = filas.filter(function (f) { return f.sugerido })
  const conVentas = conSug.filter(function (f) { return f.unidades > 0 })
  console.log('')
  console.log('Periodo: ' + desde.toISOString().slice(0, 10) + ' al ' + new Date(hasta.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10) + ' (' + nVentas + ' ventas)')
  console.log('Ventas: ' + pesos(V) + ' | Ganancia bruta: ' + pesos(G) + ' | Margen global: ' + pct(V ? G / V : 0))
  if (gastos) {
    console.log('Gastos fijos: ' + pesos(gastos) + ' | Resultado: ' + pesos(G - gastos) + ' | Equilibrio hoy: ' + pesos(gastos / (G / V)))
  }
  console.log('Objetivo de margen: ' + pct(objetivo))
  console.log('Productos por debajo del objetivo: ' + conSug.length + ' (con ventas en el periodo: ' + conVentas.length + ')')
  console.log('')
  console.log('Si subis los N productos con mas impacto (ordenados por ganancia extra):')

  const cortes = [10, 20, 50, 100].filter(function (n) { return n < conVentas.length }).concat([conVentas.length])
  const vistos = {}
  for (const n of cortes) {
    if (n <= 0 || vistos[n]) continue
    vistos[n] = true
    const top = conVentas.slice(0, n)
    for (const modo of ['0', 'P']) {
      let dR = 0
      let dG = 0
      for (const f of top) {
        dR += modo === '0' ? f.dR0 : f.dRP
        dG += modo === '0' ? f.dG0 : f.dGP
      }
      const m = (G + dG) / (V + dR)
      let txt = '  Top ' + n + (modo === '0' ? ' (mismas unidades)' : ' (perdiendo ' + Math.round(perdida * 100) + '% de unidades)')
      txt += ': margen global ' + pct(m) + ' | ganancia ' + pesos(G + dG)
      if (gastos) txt += ' | resultado ' + pesos(G + dG - gastos) + ' | equilibrio ' + pesos(gastos / m)
      console.log(txt)
    }
  }
  console.log('')
  console.log('Archivo: ' + salida)
  await mongoose.disconnect()
}

main().catch(function (e) {
  console.error('Error:', e.message)
  process.exit(1)
})