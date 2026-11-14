/* eslint-disable @typescript-eslint/no-require-imports */
// Auditoria del catalogo: que productos de stock no tienen ficha y que campos estan vacios.
// SOLO LEE la base, no modifica nada.
// Uso: node scripts/auditar-catalogo.js
const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')

const CAMPOS = [
  ['descripcion', 'descripcion'],
  ['paraQueSirve', 'para que sirve'],
  ['quienLoPide', 'quien lo pide'],
  ['comoSeUsa', 'como se usa'],
  ['datosClave', 'datos clave'],
  ['formaApariencia', 'forma/apariencia'],
]

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

function csv(t) {
  return '"' + String(t === undefined || t === null ? '' : t).replace(/"/g, '""') + '"'
}

function vacio(v) {
  return v === undefined || v === null || String(v).trim() === ''
}

async function main() {
  await mongoose.connect(leerEnv())
  const db = mongoose.connection.db
  const productos = await db.collection('products').find({ activo: true }).toArray()
  const fichas = await db.collection('fichas').find({ activo: true }).toArray()
  const categorias = await db.collection('categories').find({}).toArray()
  const catPorId = {}
  for (const c of categorias) catPorId[String(c._id)] = c.nombre

  const fichasPorCodigo = {}
  const fichasPorCodigoMin = {}
  for (const f of fichas) {
    const cod = String(f.codigo || '').trim()
    if (!cod) continue
    if (!fichasPorCodigo[cod]) fichasPorCodigo[cod] = []
    fichasPorCodigo[cod].push(f)
    fichasPorCodigoMin[cod.toLowerCase()] = cod
  }

  const filas = []
  const codigosProducto = {}
  let conFicha = 0
  let sinFicha = 0
  let sinCodigo = 0
  let conImagen = 0
  let conVenta = 0
  let fichaIncompleta = 0
  let sinPrecio = 0
  let sinCategoria = 0
  let sinUnidad = 0
  let duplicadas = 0
  let casoDistinto = 0
  const faltaPorCampo = {}
  for (const c of CAMPOS) faltaPorCampo[c[0]] = 0

  for (const p of productos) {
    const cod = String(p.codigo || '').trim()
    if (cod) codigosProducto[cod] = true
    const problemas = []
    let vacios = []
    let imagen = ''
    const precio = Number(p.precioVenta) || 0
    const categoria = p.categoria ? catPorId[String(p.categoria)] || '' : ''
    if (precio <= 0) {
      problemas.push('SIN PRECIO')
      sinPrecio++
    }
    if (!categoria) {
      problemas.push('SIN CATEGORIA')
      sinCategoria++
    }
    if (vacio(p.unidad)) {
      problemas.push('SIN UNIDAD')
      sinUnidad++
    }
    if (!cod) {
      problemas.push('SIN CODIGO (no se puede vincular con una ficha)')
      sinCodigo++
    } else {
      const lista = fichasPorCodigo[cod]
      if (!lista) {
        sinFicha++
        const parecido = fichasPorCodigoMin[cod.toLowerCase()]
        if (parecido) {
          problemas.push('FICHA CON OTRO CODIGO (' + parecido + ')')
          casoDistinto++
        } else {
          problemas.push('SIN FICHA')
        }
      } else {
        conFicha++
        if (lista.length > 1) {
          problemas.push('FICHA DUPLICADA (' + lista.length + ')')
          duplicadas++
        }
        const f = lista[lista.length - 1]
        vacios = CAMPOS.filter(function (c) { return vacio(f[c[0]]) }).map(function (c) { return c[1] })
        for (const c of CAMPOS) if (vacio(f[c[0]])) faltaPorCampo[c[0]]++
        if (vacios.length) {
          fichaIncompleta++
          problemas.push('FICHA INCOMPLETA (' + vacios.length + ' de ' + CAMPOS.length + ' campos vacios)')
        }
        imagen = f.imagen ? String(f.imagen) : ''
        if (imagen) conImagen++
        if (Array.isArray(f.ventaCruzada) && f.ventaCruzada.length) conVenta++
      }
    }
    if (problemas.length) {
      filas.push({
        tipo: 'PRODUCTO',
        codigo: cod,
        nombre: String(p.nombre || '').replace(/\s+/g, ' ').trim(),
        categoria: categoria,
        precio: precio,
        stock: p.cantidad,
        unidad: p.unidad || '',
        problemas: problemas.join(' | '),
        vacios: vacios.join(', '),
        imagen: imagen ? 'SI' : 'NO',
      })
    }
  }

  // Fichas que no corresponden a ningun producto activo
  let huerfanas = 0
  for (const f of fichas) {
    const cod = String(f.codigo || '').trim()
    if (cod && codigosProducto[cod]) continue
    huerfanas++
    filas.push({
      tipo: 'FICHA HUERFANA',
      codigo: cod,
      nombre: String(f.nombre || '').replace(/\s+/g, ' ').trim(),
      categoria: f.categoria || '',
      precio: '',
      stock: '',
      unidad: '',
      problemas: cod ? 'Ficha sin producto activo con ese codigo' : 'Ficha sin codigo',
      vacios: '',
      imagen: f.imagen ? 'SI' : 'NO',
    })
  }

  filas.sort(function (a, b) {
    if (a.tipo !== b.tipo) return a.tipo === 'PRODUCTO' ? -1 : 1
    return a.nombre.localeCompare(b.nombre, 'es')
  })

  const cab = ['tipo', 'codigo', 'nombre', 'categoria', 'precio', 'stock', 'unidad', 'problemas', 'campos vacios', 'tiene imagen']
  const lineas = [cab.join(';')]
  for (const f of filas) {
    lineas.push([
      f.tipo,
      csv(f.codigo),
      csv(f.nombre),
      csv(f.categoria),
      f.precio === '' ? '' : String(Math.round(f.precio)).replace('.', ','),
      f.stock === '' ? '' : String(f.stock).replace('.', ','),
      csv(f.unidad),
      csv(f.problemas),
      csv(f.vacios),
      f.imagen,
    ].join(';'))
  }
  const salida = path.join(os.homedir(), 'auditoria-catalogo.csv')
  fs.writeFileSync(salida, '﻿' + lineas.join('\r\n'), 'utf8')

  console.log('')
  console.log('Productos activos en stock: ' + productos.length)
  console.log('  Con ficha: ' + conFicha + ' | SIN ficha: ' + sinFicha + ' | sin codigo: ' + sinCodigo)
  if (casoDistinto) console.log('  De los sin ficha, ' + casoDistinto + ' tienen ficha con el codigo escrito distinto (mayusculas)')
  console.log('Fichas incompletas (algun campo de texto vacio): ' + fichaIncompleta)
  for (const c of CAMPOS) if (faltaPorCampo[c[0]]) console.log('  Sin ' + c[1] + ': ' + faltaPorCampo[c[0]])
  console.log('Fichas con imagen: ' + conImagen + ' de ' + conFicha + ' | con venta cruzada: ' + conVenta)
  console.log('Productos sin precio: ' + sinPrecio + ' | sin categoria: ' + sinCategoria + ' | sin unidad: ' + sinUnidad)
  console.log('Fichas duplicadas (mismo codigo): ' + duplicadas + ' | fichas huerfanas: ' + huerfanas)
  console.log('')
  console.log('Archivo: ' + salida)
  await mongoose.disconnect()
}

main().catch(function (e) {
  console.error('Error:', e.message)
  process.exit(1)
})