import test from 'node:test'
import assert from 'node:assert/strict'
import { unirCatalogo } from '../src/lib/catalogo.ts'

const producto = { _id: 'p1', codigo: '100', nombre: 'Producto actual', categoria: { nombre: 'Plomeria' }, precioVenta: 1500, cantidad: 0, unidad: 'u' }
test('stock es la fuente de código, nombre, categoría, precio y cantidad; conserva la ficha', () => {
  const [f] = unirCatalogo([producto], [{ _id: 'f1', codigo: '100', nombre: 'Viejo', categoria: 'Otra', precioVenta: 50, cantidad: 10, descripcion: 'Información real', imagen: 'https://ejemplo.test/100.png' }])
  assert.equal(f.nombre, producto.nombre)
  assert.equal(f.categoria, 'Plomeria')
  assert.equal(f.precioVenta, 1500)
  assert.equal(f.cantidad, 0)
  assert.equal(f.descripcion, 'Información real')
  assert.equal(f._id, 'f1')
  assert.equal(f.productoId, 'p1')
  assert.equal(f.imagen, 'https://ejemplo.test/100.png')
})
test('producto nuevo o sin imagen sigue visible y se puede completar', () => {
  const [f] = unirCatalogo([producto], [])
  assert.equal(f.codigo, '100')
  assert.equal(f.imagen, '')
  assert.equal(f._id, undefined)
  assert.deepEqual(f.ventaCruzada, [])
})
test('no muestra fichas huérfanas ni une productos por códigos vacíos', () => {
  const result = unirCatalogo([{ ...producto, codigo: '', categoria: null }], [{ codigo: '', descripcion: 'No asignar' }, { codigo: '999' }])
  assert.equal(result.length, 1)
  assert.equal(result[0].descripcion, '')
  assert.equal(result[0].categoria, '')
})
test('normaliza espacios pero conserva mayúsculas y variantes del código', () => {
  const result = unirCatalogo([{ ...producto, codigo: ' 12095a ' }], [{ codigo: '12095a', descripcion: 'Blanco' }, { codigo: '12095c', descripcion: 'Negro' }])
  assert.equal(result[0].codigo, '12095a')
  assert.equal(result[0].descripcion, 'Blanco')
})
