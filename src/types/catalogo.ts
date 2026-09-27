export interface IFicha {
  _id?: string
  id?: string
  codigo?: string
  imagen?: string
  nombre: string
  categoria: string
  descripcion: string
  paraQueSirve: string
  quienLoPide: string
  comoSeUsa: string
  ventaCruzada: string[]
  datosClave: string
  formaApariencia: string
  productoId?: string
  precioVenta?: number
  cantidad?: number
  unidad?: string
  fuentes?: { titulo: string; url: string }[]
}
