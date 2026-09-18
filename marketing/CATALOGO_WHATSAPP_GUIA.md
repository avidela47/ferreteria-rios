# Catálogo de WhatsApp Business — Ferretería Ríos

Guía para cargar el catálogo con la lista de `catalogo-whatsapp.csv` (77 productos, 12 categorías).
No reemplaza tu web ni permite comprar online: es una vitrina para que los vecinos vean y consulten por chat.

## Paso 1 — Revisar qué fotos ya tenés

Antes de sacar fotos nuevas, entrá a tu Catálogo web (ferreteria-rios.vercel.app) y anotá en la
columna `FotoListaSN` del CSV qué códigos ya tienen imagen cargada en el VPS. Esas las bajás
directo al celular (captura o guardar imagen) y ahorrás tiempo.

## Paso 2 — Sacar las fotos que faltan

Para los que no tengan foto todavía:
- Fondo neutro (mostrador limpio o pared lisa, sin desorden atrás)
- Luz natural o buena luz de local, sin sombras duras
- Producto centrado, ocupando la mayor parte del cuadro
- Una foto alcanza por producto para arrancar (no hace falta las 10 que permite WhatsApp)

## Paso 3 — Crear las colecciones (categorías) primero

En WhatsApp Business: Configuración → Herramientas para la empresa → Catálogo → Colecciones → Crear colección.

Creá una por cada categoría del CSV, en este orden (de más a menos productos):
Plomería, Herramientas, Electricidad, Fijaciones y Buloneria, Adhesivos y Selladores,
Cerrajería y Herrajes, Pinturería, Materiales de Obra, Lubricantes y Química, Seguridad y EPP,
Gas, Varios.

## Paso 4 — Cargar productos, de a una categoría por vez

Configuración → Herramientas para la empresa → Catálogo → Agregar producto o servicio.

Por cada producto, usá los datos del CSV:
- **Foto**: la que sacaste o bajaste
- **Nombre**: la columna `ProductoCorto` (no el nombre técnico largo del sistema)
- **Precio**: la columna `Precio`
- **Descripción**: la columna `DescripcionBreve`
- **Código**: opcional, poné el código del sistema si querés identificarlo rápido cuando alguien pregunte
- Asignalo a la colección de su categoría

No cargues los 77 de una sentada. Sugerencia: una categoría por día, 5-10 productos por vez.
Empezá por Plomería y Herramientas — son las que más se consultan en una ferretería de barrio.

## Paso 5 — Difundir

Una vez armado:
- Fijá el link del catálogo como mensaje de bienvenida o en tu estado de WhatsApp
- Subí 2-3 productos por semana como "Estado" (rotando), así aparecen sin que nadie tenga que buscar
- Compartí el link del catálogo a contactos nuevos en vez de mandar fotos sueltas

## Mantenimiento

Cuando un precio cambie fuerte, actualizalo en el catálogo (no hace falta al instante, pero sí
cada tanto — un precio muy desactualizado genera reclamos). No hace falta sincronizar en vivo con
la web, es manual.

## Siguiente tanda

Cuando termines estos 77, tenés margen hasta 500 (límite de WhatsApp), aunque arriba de ~100 se
vuelve incómodo de navegar. Si querés sumar más después, avisame y armamos la tanda 2 con el mismo
criterio.
