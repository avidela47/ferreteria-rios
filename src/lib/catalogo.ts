import type { IFicha } from '../types/catalogo'

export interface ProductoCatalogo {
  _id: unknown
  codigo?: string
  nombre: string
  categoria?: { nombre?: string } | null
  precioVenta: number
  cantidad: number
  unidad: string
}

export function unirCatalogo(productos: ProductoCatalogo[], fichas: IFicha[]): IFicha[] {
  const porCodigo = new Map(fichas.filter(f => f.codigo?.trim()).map(f => [f.codigo!.trim(), f]))
  return productos.map(producto => {
    const codigo = producto.codigo?.trim() ?? ''
    const ficha = codigo ? porCodigo.get(codigo) : undefined
    return {
      descripcion: '', paraQueSirve: '', quienLoPide: '', comoSeUsa: '',
      datosClave: '', formaApariencia: '', ventaCruzada: [], imagen: '',
      ...ficha,
      productoId: String(producto._id),
      codigo,
      nombre: producto.nombre,
      categoria: producto.categoria?.nombre ?? '',
      precioVenta: producto.precioVenta,
      cantidad: producto.cantidad,
      unidad: producto.unidad,
    }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
