export interface IFicha {
  _id?: string
  id: string
  codigo?: string
  nombre: string
  categoria: string
  descripcion: string
  paraQueSirve: string
  quienLoPide: string
  comoSeUsa: string
  ventaCruzada: string[]
  datosClave: string
  formaApariencia: string
}