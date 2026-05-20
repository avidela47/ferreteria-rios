const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = 'mongodb+srv://avidela47:avupk014@cluster0.9herq1s.mongodb.net/ferreteria-rios'

// Categorías que ya existen en MongoDB — las IDs se buscan por nombre
const CATEGORIAS = {
  electricidad: 'Electricidad',
  plomeria: 'Plomeria',
  herramientas: 'Herramientas',
  pintureria: 'Pintureria',
  fijaciones: 'Fijaciones y buloneria',
  adhesivos: 'Adhesivos y selladores',
  cerrajeria: 'Cerrajeria y herrajes',
  materiales: 'Materiales de obra',
  seguridad: 'Seguridad y EPP',
}

// Productos del presupuesto de Tincho con categoría asignada
// Formato: [nombre, cantidad, precioCosto, categoria, unidad]
const PRODUCTOS = [
  // ELECTRICIDAD
  ['Cano Luz Corrugado Blanco 7/8" x 25m', 5, 10082.40, 'electricidad', 'u.'],
  ['Cano Luz Corrugado Naranja 7/8" x 25m', 5, 7182.98, 'electricidad', 'u.'],
  ['Cano Termofusion 20mm 4m LATYN', 10, 4657.56, 'electricidad', 'u.'],
  ['Electrodo 2.5mm E6013 LITCH', 10, 4845.78, 'electricidad', 'kg'],
  ['Cinta Aisladora Negra 10m JAZAK', 10, 528.27, 'electricidad', 'u.'],
  ['Capa Aisladora 15cm x 50m Film 200mc', 10, 3724.38, 'electricidad', 'u.'],
  ['Caja Capsulada C800 Vacia', 2, 2903.05, 'electricidad', 'u.'],
  ['Caja Capsulada C801 Toma Combinada 10amp', 2, 4438.32, 'electricidad', 'u.'],
  ['Caja Capsulada C802 1 Punto 10amp', 2, 3689.47, 'electricidad', 'u.'],
  ['Caja Capsulada C807 Punto Doble 10amp', 4, 4319.23, 'electricidad', 'u.'],
  ['Caja Llave Termica 1 a 2 con Puerta KURBOX', 2, 1590.99, 'electricidad', 'u.'],
  ['Caja Llave Termica 2 a 4 con Puerta', 2, 2483.29, 'electricidad', 'u.'],
  ['Ficha Triple Super Grande 3P', 10, 2753.44, 'electricidad', 'u.'],
  ['Cinta Aisladora Amarilla Verde 10m DOBLE A', 10, 1228.71, 'electricidad', 'u.'],
  ['Clips Cocodrilo 10amp Rojo y Negro', 2, 923.46, 'electricidad', 'par'],
  ['Clips Cocodrilo 30amp Rojo y Negro', 2, 1431.28, 'electricidad', 'par'],
  ['Calentador de Inmersion Metalico Largo', 4, 4738.24, 'electricidad', 'u.'],
  ['Calentador de Inmersion Metalico Corto', 4, 4738.24, 'electricidad', 'u.'],
  ['Cinta Pasacable 20m Plastica VIYILANT', 2, 5383.72, 'electricidad', 'u.'],
  ['Cinta Pasacable 15m Plastica VIYILANT', 2, 4540.33, 'electricidad', 'u.'],
  ['Regulador Gas Manguera 1.50m CHICO', 10, 10908.42, 'electricidad', 'u.'],

  // PLOMERIA
  ['Grampa Lavatorio S', 12, 482.10, 'plomeria', 'u.'],
  ['Flexible Extensor Gas Nat 200-420mm LATYNFLEX', 10, 15311.68, 'plomeria', 'u.'],
  ['Flexible Extensor Gas Nat 400-950mm LATYNFLEX', 10, 24358.47, 'plomeria', 'u.'],
  ['Adaptador Bronce Garrafa 3-10kg', 2, 3961.83, 'plomeria', 'u.'],
  ['Adaptador Bronce Garrafa 10-3kg', 2, 3961.83, 'plomeria', 'u.'],
  ['Teton Bronce 1/2" Hembra', 10, 1717.08, 'plomeria', 'u.'],
  ['Teflon 3/4" x 10m', 100, 380.25, 'plomeria', 'u.'],
  ['Cartucho Recarga Gas Encendedor 18cc', 5, 1718.50, 'plomeria', 'u.'],
  ['Cartucho Gas Butano 227cc KOVEA', 5, 2732.39, 'plomeria', 'u.'],
  ['Abrazadera Gas 12 17mm CARBIZ', 1, 809.02, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°8 16mm PERFECTO', 1, 743.94, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°12 22mm PERFECTO', 1, 750.47, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°16 27mm PERFECTO', 1, 771.88, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°23 35mm PERFECTO', 1, 814.71, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°30 45mm PERFECTO', 1, 842.64, 'plomeria', 'u.'],
  ['Abrazadera Cremallera N°40 60mm PERFECTO', 1, 955.31, 'plomeria', 'u.'],
  ['Acople Rapido Riego Reparar Manguera 3/4"', 5, 1590.60, 'plomeria', 'u.'],
  ['Acople Rapido Riego Sin STOP 1/2" REHAU', 1, 2555.43, 'plomeria', 'u.'],
  ['Acople Rapido Riego Sin STOP 1/2" REHAU', 5, 1529.44, 'plomeria', 'u.'],
  ['Acople Rapido Riego Reparar Manguera 1/2"', 5, 1340.18, 'plomeria', 'u.'],
  ['Conexion Inodoro Extensible Articulable Fuelle', 2, 3150.58, 'plomeria', 'u.'],
  ['Codo H-H 1/2" Polipropileno GINY PLAS', 25, 312.44, 'plomeria', 'u.'],
  ['Codo H-H 3/4" Polipropileno GINY PLAS', 25, 519.31, 'plomeria', 'u.'],
  ['Codo H-H 1" Polipropileno GINY PLAS', 25, 958.59, 'plomeria', 'u.'],
  ['Codo M-H 1/2" Polipropileno GINY PLAS', 25, 335.38, 'plomeria', 'u.'],
  ['Codo M-H 3/4" Polipropileno GINY PLAS', 25, 549.61, 'plomeria', 'u.'],
  ['Codo M-H 1" Polipropileno GINY PLAS', 25, 974.79, 'plomeria', 'u.'],
  ['Acople Compresion 1/2" LARGO DUKE', 3, 2797.72, 'plomeria', 'u.'],
  ['Acople Compresion 3/4" LARGO DUKE', 3, 3458.15, 'plomeria', 'u.'],
  ['Arandela Plastica 3/4" x 100u', 100, 68.69, 'plomeria', 'u.'],
  ['Arandela Plastica 1/2" x 100u MALVAR', 100, 59.73, 'plomeria', 'u.'],
  ['Canilla Plastica 1/2" Manga Blanca GINY PLAS', 12, 2032.09, 'plomeria', 'u.'],
  ['Canilla Plastica 1/2" ESF Mariposa DUKE', 12, 2515.52, 'plomeria', 'u.'],
  ['Canilla Plastica 3/4" Manga Blanca GINY PLAS', 12, 2283.42, 'plomeria', 'u.'],
  ['Canilla Plastica 1/2" ESF Palanca Acople', 12, 1791.44, 'plomeria', 'u.'],
  ['Canilla Metalica 1/2" ESF Mariposa', 12, 4383.72, 'plomeria', 'u.'],
  ['Canilla Metalica 1/2" ESF Palanca', 12, 4383.72, 'plomeria', 'u.'],
  ['Contratapa Tipo Franklin con Boton', 2, 2922.69, 'plomeria', 'u.'],
  ['Contratapa Tipo Franklin sin Armar', 2, 1532.67, 'plomeria', 'u.'],
  ['Conexion Inodoro Largo Fuelle', 12, 1667.54, 'plomeria', 'u.'],
  ['Conexion Inodoro Hembra Fuelle TRAFUL', 2, 1542.53, 'plomeria', 'u.'],
  ['Conexion Desplaza Inodoro Corta 6cm', 2, 4686.04, 'plomeria', 'u.'],
  ['Conexion Desplaza Inodoro Larga 12cm', 2, 5965.53, 'plomeria', 'u.'],
  ['Tee Polipropileno 1/2" GINY PLAS', 30, 576.33, 'plomeria', 'u.'],
  ['Tapon Polipropileno 3/4" Macho GINY PLAS', 20, 212.06, 'plomeria', 'u.'],
  ['Boya Telgopor Redonda 3/4"', 10, 2114.48, 'plomeria', 'u.'],
  ['Acople Compresion 1/2" GINY PLAS', 5, 2073.02, 'plomeria', 'u.'],
  ['Acople Compresion 3/4" GINY PLAS', 5, 2487.84, 'plomeria', 'u.'],
  ['Acople Compresion 1" GINY PLAS', 5, 3023.15, 'plomeria', 'u.'],
  ['Base Aro Doble Desplazado Apoyo Inodoro', 5, 1322.64, 'plomeria', 'u.'],
  ['Base Aro Simple Apoyo Inodoro', 4, 1125.38, 'plomeria', 'u.'],
  ['Boya Universal de Desborde', 12, 2041.58, 'plomeria', 'u.'],
  ['Cinta Destapa Canerias 5m VIYILANT', 4, 9600.40, 'plomeria', 'u.'],
  ['Codo Fusion HH 20mm GINY PLAS', 25, 303.57, 'plomeria', 'u.'],
  ['Codo Fusion HH 25mm LATYN', 30, 397.87, 'plomeria', 'u.'],
  ['Deposito Colgar Boton 8lts MONKOTO', 1, 17045.12, 'plomeria', 'u.'],
  ['Deposito Mochila Boton 16lts SIFOLIMP', 1, 54478.64, 'plomeria', 'u.'],
  ['Sifon Simple Negro con Visor', 10, 8293.93, 'plomeria', 'u.'],
  ['Asiento Inodoro Blanco Inflado MONKOTO', 6, 15668.16, 'plomeria', 'u.'],
  ['Asiento Inodoro Negro Inflado MONKOTO', 1, 16921.60, 'plomeria', 'u.'],
  ['Asiento Inodoro Arena Inflado MONKOTO', 1, 16964.71, 'plomeria', 'u.'],
  ['Asiento Inodoro Fuerza Aerea Inflado MONKOTO', 1, 16964.71, 'plomeria', 'u.'],
  ['Sombrerete 2 Alas 4" ECOGAS', 6, 10147.29, 'plomeria', 'u.'],
  ['Curva Codo Hermetico 150mm 6" 90 Chapa', 2, 15838.79, 'plomeria', 'u.'],
  ['Curva Codo Hermetico 125mm 5" 90 Chapa', 2, 11071.98, 'plomeria', 'u.'],
  ['Cano Chapa 100mm x 1m Galvanizada', 5, 4579.44, 'plomeria', 'u.'],
  ['Cano Chapa 75mm x 1m Galvanizada', 4, 4076.38, 'plomeria', 'u.'],
  ['Cano Chapa 125mm x 1m Galvanizada', 4, 7349.24, 'plomeria', 'u.'],
  ['Cano Aluminio 3" x 1m Compactado', 2, 7112.92, 'plomeria', 'u.'],
  ['Cano Aluminio 4" x 2m Compactado', 2, 16410.18, 'plomeria', 'u.'],
  ['Cano Polipropileno Bicapa 1/2" 6m', 5, 7213.59, 'plomeria', 'u.'],
  ['Cano Extensible 2.20m Blanco Bano', 5, 10172.65, 'plomeria', 'u.'],
  ['Cano Extensible 2.00m Aluminio Bano', 5, 7523.14, 'plomeria', 'u.'],

  // HERRAMIENTAS
  ['Cano Cortina 1/2" x 1.20m con Soportes y Terminales', 3, 4371.30, 'herramientas', 'u.'],
  ['Cano Cortina 5/8" x 4.00m Hz Zincado', 3, 6610.74, 'herramientas', 'u.'],
  ['Escalera Aluminio Familiar 3 Peldanos 1.17m', 1, 48983.38, 'herramientas', 'u.'],
  ['Escalera Aluminio Familiar 5 Peldanos 1.64m', 1, 69539.58, 'herramientas', 'u.'],
  ['Escalera Aluminio Familiar 7 Peldanos 2.12m', 1, 90016.20, 'herramientas', 'u.'],
  ['Juego Herramientas 7pzs Alic/Dest/Mart/Cutt', 1, 41291.09, 'herramientas', 'u.'],
  ['Destornillador Phillips 3x75mm Cabo Azul', 1, 2084.83, 'herramientas', 'u.'],
  ['Destornillador Phillips 4x150mm Cabo Azul', 3, 3127.23, 'herramientas', 'u.'],
  ['Destornillador Phillips 5x75mm Cabo Azul', 2, 2837.67, 'herramientas', 'u.'],
  ['Destornillador Phillips 5x75mm Cabo Rojo', 2, 2837.67, 'herramientas', 'u.'],
  ['Destornillador Plano 3x100mm Cabo Rojo', 1, 2548.11, 'herramientas', 'u.'],
  ['Destornillador Plano 4x100mm Cabo Rojo', 1, 2953.51, 'herramientas', 'u.'],
  ['Arco de Sierra Juniors con Hoja 6" LACATUS', 6, 1918.76, 'herramientas', 'u.'],
  ['Tanza Albanil 1.00mm GRILON', 12, 4854.76, 'u.'],
  ['Martillo Bolita Cabo Madera 110grs LACATUS', 6, 4648.25, 'herramientas', 'u.'],
  ['Martillo Carpintero 20mm LACATUS', 6, 5981.42, 'herramientas', 'u.'],
  ['Martillo Galponero Cabo Madera 27mm', 6, 7856.39, 'herramientas', 'u.'],
  ['Martillo Bolita Cabo Madera 220grs LACATUS', 3, 5768.05, 'herramientas', 'u.'],
  ['Maza Minera 1.000kg EL ROBLE', 6, 12974.04, 'herramientas', 'u.'],
  ['Maza Minera 1.500kg EL ROBLE', 6, 17915.82, 'herramientas', 'u.'],
  ['Cuchara Albanil N°7 EL ROBLE', 1, 8962.29, 'herramientas', 'u.'],
  ['Machete 22" LACATUS', 3, 7326.54, 'herramientas', 'u.'],
  ['Carretel Porta Tanza C/ Ranura 2pzs', 5, 1459.84, 'herramientas', 'u.'],
  ['Pulverizador Presion 2lts LACATUS', 3, 8933.17, 'herramientas', 'u.'],
  ['Pulverizador Presion 3lts LACATUS', 3, 21288.89, 'herramientas', 'u.'],
  ['Cabo Pala 70cm Emp Metal', 3, 5039.30, 'herramientas', 'u.'],
  ['Cabo Pala 120cm', 3, 6502.21, 'herramientas', 'u.'],
  ['Cabo Escoba Barre Hojas Rosca 1.20m', 5, 1223.56, 'herramientas', 'u.'],
  ['Cabo Hacha 90cm', 2, 5281.82, 'herramientas', 'u.'],
  ['Cabo Hacha 35cm', 2, 1451.02, 'herramientas', 'u.'],
  ['Hacha de Mano 600grs Cabo Madera LACATUS', 3, 12053.75, 'herramientas', 'u.'],
  ['Tijera Multiuso 8.1/2" WORKPRO', 6, 4227.56, 'herramientas', 'u.'],
  ['Llave Mandril 13mm TOOLMAK', 6, 1916.26, 'herramientas', 'u.'],
  ['Llave Mandril 4 Medidas TUCSON', 6, 2897.11, 'herramientas', 'u.'],
  ['Hoja Sierra Juniors Miniflex x10 SIN PAR', 10, 937.24, 'herramientas', 'u.'],
  ['Hoja Sierra Acero Aleado 18 Dientes', 10, 1796.85, 'herramientas', 'u.'],
  ['Hoja Sierra Acero Aleado 24 Dientes', 10, 1796.85, 'herramientas', 'u.'],
  ['Hoja Sierra Caladora 5pzs LACATUS', 6, 3273.86, 'herramientas', 'u.'],
  ['Grampa Engrampadora 8mm 1000u WORKPRO', 10, 3011.41, 'herramientas', 'u.'],
  ['Pistola Aplicar Silicona Reforzada JAZAK', 6, 8008.42, 'herramientas', 'u.'],
  ['Cinta Sillon Amarilla 100m TECNOTEX', 1, 38278.35, 'herramientas', 'u.'],
  ['Cinta Sillon Celeste 100m TECNOTEX', 1, 38278.35, 'herramientas', 'u.'],
  ['Cinta Sillon Naranja 100m TECNOTEX', 1, 38278.35, 'herramientas', 'u.'],
  ['Cepillo Amoladora Conico 115mm Acero Trenzado', 6, 5748.29, 'herramientas', 'u.'],
  ['Cinta Demarcatoria Peligro 200m', 5, 5123.48, 'herramientas', 'u.'],
  ['Carretel Porta Tanza Universal N°10', 6, 1018.26, 'herramientas', 'u.'],
  ['Carretel Porta Tanza Automatico Standard', 2, 2159.41, 'herramientas', 'u.'],
  ['Carretel Porta Tanza Chico 3pzs N°1', 5, 2327.70, 'herramientas', 'u.'],
  ['Caja Organizadora N°2 22.5x15x5cm', 1, 5487.25, 'herramientas', 'u.'],
  ['Caja Organizadora N°1 18.7x11.7x4cm', 1, 4333.52, 'herramientas', 'u.'],
  ['Tanza Albanil 1.00mm GRILON', 12, 4854.76, 'herramientas', 'u.'],
  ['Barral Madera Simple Kit 22mm x 1.40m', 2, 4939.44, 'herramientas', 'u.'],
  ['Barral Madera Simple Kit 22mm x 1.60m', 2, 5220.61, 'herramientas', 'u.'],
  ['Barral Madera Simple Kit 22mm x 1.80m', 2, 6377.15, 'herramientas', 'u.'],
  ['Barral Madera Simple Kit 22mm x 2.00m', 2, 6658.33, 'herramientas', 'u.'],
  ['Canamo x 20grs GM', 10, 1892.25, 'herramientas', 'u.'],
  ['Cepillo Lava Jean MAKE', 5, 2841.34, 'herramientas', 'u.'],
  ['Aceite Aplicador 100cc Bicicleta ACEITODO', 2, 1700.02, 'herramientas', 'u.'],
  ['Aceite Aplicador 100cc Multiuso ACEITODO', 2, 1539.13, 'herramientas', 'u.'],
  ['Aceite Aerosol Multiuso 220cc ACEITODO', 2, 5384.92, 'herramientas', 'u.'],
  ['Aceite Aerosol Arranca Motores 440cc ACEITEX', 4, 12782.99, 'herramientas', 'u.'],

  // PINTURERIA
  ['Pintura Aerosol Blanco Brillante 200ml DOBLE A', 12, 3103.53, 'pintureria', 'u.'],
  ['Pintura Aerosol Negro Brillante 200ml DOBLE A', 12, 3103.52, 'pintureria', 'u.'],
  ['Pintura Aerosol Aluminio 200ml DOBLE A', 6, 3103.52, 'pintureria', 'u.'],
  ['Pintura Aerosol Azul Marino 200ml DOBLE A', 6, 3103.52, 'pintureria', 'u.'],
  ['Pintura Aerosol Rojo 200ml DOBLE A', 6, 3448.36, 'pintureria', 'u.'],
  ['Enduido 1/2kg', 6, 1975.47, 'pintureria', 'u.'],
  ['Ceresita 1lt WEBER', 6, 4283.63, 'pintureria', 'u.'],
  ['Tela Esmeril Grano 100 RAPIFIX', 25, 944.34, 'pintureria', 'u.'],
  ['Tela Esmeril Grano 80 RAPIFIX', 25, 944.34, 'pintureria', 'u.'],
  ['Tela Esmeril Grano 36 RAPIFIX', 25, 944.34, 'pintureria', 'u.'],
  ['Bandeja de Pintor Mini', 5, 750.92, 'pintureria', 'u.'],
  ['Bandeja de Pintor Grande', 5, 2317.41, 'pintureria', 'u.'],
  ['Cinta Enmascarar 18mm x 40m NEWTAPE', 16, 1639.40, 'pintureria', 'u.'],
  ['Cinta Enmascarar 24mm x 40m NEWTAPE', 12, 2171.68, 'pintureria', 'u.'],
  ['Cinta Enmascarar 36mm x 40m NEWTAPE', 16, 3236.24, 'pintureria', 'u.'],
  ['Cinta Enmascarar Azul 48mm DOBLE A', 10, 8105.30, 'pintureria', 'u.'],

  // FIJACIONES Y BULONERIA
  ['Clavo Punta Paris 38mm ACINDAR', 1, 5994.76, 'fijaciones', 'kg'],
  ['Clavo Punta Paris 50mm ACINDAR', 1, 5676.04, 'fijaciones', 'kg'],
  ['Clavo Espiralado 25mm ACINDAR', 1, 8802.16, 'fijaciones', 'kg'],
  ['Clavo Espiralado 38mm ACINDAR', 1, 8156.50, 'fijaciones', 'kg'],
  ['Alambre Negro Recocido N°17 Rollo 1kg BARZEL', 10, 4235.00, 'fijaciones', 'kg'],
  ['Tornillo Mecha 8x1/2" JOMARCA', 1000, 15.06, 'fijaciones', 'u.'],
  ['Tornillo Drywall 6x1.5/8" Grueso', 1000, 17.81, 'fijaciones', 'u.'],
  ['Tornillo Drywall 6x1.1/4" Grueso JOMARCA', 1000, 14.64, 'fijaciones', 'u.'],
  ['Tornillo Drywall 6x5/8" Grueso', 1000, 6.83, 'fijaciones', 'u.'],
  ['Tornillo Drywall 8x2" Grueso', 600, 26.84, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x25 Fino', 1000, 10.84, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x32 Fino', 1000, 13.35, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x42 Fino', 1000, 17.69, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x45 Fino', 1000, 16.14, 'fijaciones', 'u.'],
  ['Tornillo Drywall 6x3/4" Grueso JOMARCA', 1000, 8.52, 'fijaciones', 'u.'],
  ['Tornillo Drywall 6x1" Grueso', 1000, 11.24, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x35 Fino', 1000, 14.19, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x38 Fino', 1000, 14.46, 'fijaciones', 'u.'],
  ['Tornillo Drywall 3.5x50 Fino', 1000, 16.43, 'fijaciones', 'u.'],
  ['Taco con Tope Arandela N°10 x500u LA HACENDOSA', 500, 30.48, 'fijaciones', 'u.'],
  ['Gancho Media Sombra Broche x250u', 250, 83.90, 'fijaciones', 'u.'],
  ['Disco Corte 115x1.0mm DOBLE A', 25, 461.83, 'fijaciones', 'u.'],
  ['Disco Corte 230x2.0mm DOBLE A', 5, 7608.07, 'fijaciones', 'u.'],
  ['Disco Corte 180x1.6mm DOBLE A', 10, 717.75, 'fijaciones', 'u.'],
  ['Disco Corte Madera 115mm KLEBER', 1, 11476.55, 'fijaciones', 'u.'],

  // ADHESIVOS Y SELLADORES
  ['Burlete Espuma 20x15mm Autoadhesivo 5m', 10, 2814.46, 'adhesivos', 'u.'],
  ['Burlete Espuma 20x20mm Autoadhesivo 5m', 10, 3504.84, 'adhesivos', 'u.'],
  ['Cinta Aluminio Autoadhesiva 5cm x 3m TRIGAMA', 2, 5925.48, 'adhesivos', 'u.'],
  ['Membrana Asfaltica 10cm x 10m Autoadh KARTONSEC', 6, 12374.82, 'adhesivos', 'u.'],
  ['Cinta Doble Faz Blanca 16mm x 1m TRIGAMA', 5, 2657.46, 'adhesivos', 'u.'],
  ['Cinta Doble Faz Blanca 18mm x 5m BISON', 4, 2126.13, 'adhesivos', 'u.'],
  ['Cinta Doble Faz Blanca 24mm x 1m TRIGAMA', 4, 3411.49, 'adhesivos', 'u.'],
  ['Cinta Embalar Transparente 40m', 36, 1298.43, 'adhesivos', 'u.'],
  ['Cinta Embalar Marron 50m', 12, 2045.97, 'adhesivos', 'u.'],
  ['Cinta Persiana Blanca 50m Pesada', 1, 58672.27, 'adhesivos', 'u.'],
  ['Cemento Fortex con Tolueno 125cc Adhesivo', 10, 2940.27, 'adhesivos', 'u.'],
  ['Cemento Fortex con Tolueno 250cc Adhesivo', 10, 4119.96, 'adhesivos', 'u.'],
  ['Cemento Fortex con Tolueno 500cc Adhesivo', 5, 6631.58, 'adhesivos', 'u.'],
  ['Cemento Fortex sin Tolueno 500cc Adhesivo', 2, 6988.16, 'adhesivos', 'u.'],
  ['Cemento Fortex sin Tolueno 250cc Adhesivo', 2, 4262.26, 'adhesivos', 'u.'],
  ['Cola 125grs Fortex Pote Adhesivo Vinilico', 10, 1838.87, 'adhesivos', 'u.'],
  ['Cola 200grs Fortex Aplicador Adhesivo Vinilico', 10, 2469.63, 'adhesivos', 'u.'],
  ['Cola 800grs Fortex Aplicador Adhesivo Vinilico', 10, 6370.44, 'adhesivos', 'u.'],
  ['Adhesivo Pegamento Universal 20ml UHU', 10, 2469.63, 'adhesivos', 'u.'],
  ['Adhesivo Pegamento Universal 25ml SUPRABOND', 5, 4034.87, 'adhesivos', 'u.'],
  ['Adhesivo Pegamento Universal 100ml SUPRABOND', 2, 10282.00, 'adhesivos', 'u.'],
  ['Adhesivo Epoxi Soldadura 90Seg SUPRABOND', 3, 6025.30, 'adhesivos', 'u.'],
  ['Adhesivo Epoxi Erpox Blanco 80cc SUPRABOND', 2, 11892.55, 'adhesivos', 'u.'],
  ['Adhesivo Epoxi Erpox Acero 200cc SUPRABOND', 1, 17342.95, 'adhesivos', 'u.'],
  ['Adhesivo para Telgopor 50cc GALI', 5, 2181.34, 'adhesivos', 'u.'],
  ['Barrita Silicona Fina x kg', 1, 20647.96, 'adhesivos', 'kg'],
  ['Barrita Silicona Gruesa x kg', 1, 20647.96, 'adhesivos', 'kg'],
  ['Adhesivo para PVC 100cc GM', 5, 3223.15, 'adhesivos', 'u.'],
  ['Adhesivo para PVC 30cc GM', 10, 819.64, 'adhesivos', 'u.'],

  // CERRAJERIA Y HERRAJES
  ['Bisagra Carpintera 3 Agujeros Madera/Madera', 25, 943.30, 'cerrajeria', 'u.'],
  ['Bisagra Carpintera 5 Agujeros Madera/Madera', 25, 1065.55, 'cerrajeria', 'u.'],
  ['Bisagra Municion 60mm Ala Corta Soldar', 25, 1351.54, 'cerrajeria', 'u.'],
  ['Bisagra Municion 75mm Ala Corta Soldar', 25, 1404.42, 'cerrajeria', 'u.'],
  ['Bisagra Municion 60mm Ala Larga Soldar', 25, 1430.57, 'cerrajeria', 'u.'],
  ['Bisagra Municion 75mm Ala Larga Soldar', 25, 1785.06, 'cerrajeria', 'u.'],
  ['Bisagra T 101mm 4" x 12 pares', 1, 21908.91, 'cerrajeria', 'u.'],
  ['Bisagra T 76mm 3" x 12 pares', 1, 19363.51, 'cerrajeria', 'u.'],
  ['Bisagra Doble Accion 76mm 3" LACATUS', 2, 16970.86, 'cerrajeria', 'par'],
  ['Bisagra Doble Accion 101mm 4" JOLDEN', 2, 19007.70, 'cerrajeria', 'par'],
  ['Bisagra Libro 25mm Bronceada HARTEN', 48, 101.57, 'cerrajeria', 'u.'],
  ['Bisagra Libro 38mm Bronceada HARTEN', 24, 145.79, 'cerrajeria', 'u.'],
  ['Bisagra Mosquera Zincada Azul 64mm', 12, 1922.21, 'cerrajeria', 'u.'],
  ['Bisagra Mosquera Empavonada Negra 70mm', 10, 3225.62, 'cerrajeria', 'u.'],
  ['Bisagra Cazoleta 0 26mm Recta FUMACA', 10, 460.91, 'cerrajeria', 'u.'],
  ['Bisagra Cazoleta 0 35mm Recta FUMACA', 10, 467.02, 'cerrajeria', 'u.'],
  ['Cerradura 200 Bolsa Der Frente Ancho PRIVE', 3, 18843.86, 'cerrajeria', 'u.'],
  ['Cerradura 200 Caja Der Frente Ancho PRIVE', 3, 19538.24, 'cerrajeria', 'u.'],
  ['Cerradura 201 Der Doble Perno PRIVE', 3, 30764.04, 'cerrajeria', 'u.'],
  ['Cerradura 205 Der Doble Perno PRIVE', 3, 21138.35, 'cerrajeria', 'u.'],

  // MATERIALES DE OBRA
  ['Trampa Laucha Madera', 10, 1448.37, 'materiales', 'u.'],
  ['Trampa Rata Madera', 10, 2896.74, 'materiales', 'u.'],
  ['Cortina Mosquera 85cm ROYAR', 2, 8566.07, 'materiales', 'u.'],
  ['Cortina Mosquera 100cm ROYAR', 2, 9683.39, 'materiales', 'u.'],
  ['Cortina Bano Artesanal Tela con Ganchos', 2, 10742.77, 'materiales', 'u.'],
  ['Cortina Bano Splash Plastica con Protector', 2, 18339.14, 'materiales', 'u.'],
  ['Cortina Bano Jazmin Plastica con Protector', 2, 9309.79, 'materiales', 'u.'],
  ['Cinta Persiana Blanca 50m Pesada', 1, 58672.27, 'materiales', 'u.'],

  // SEGURIDAD Y EPP
  ['Anteojo Policarbonato Transparente PATILLA', 12, 2218.39, 'seguridad', 'u.'],
  ['Anteojo Policarbonato Negro PATILLA', 12, 1909.04, 'seguridad', 'u.'],
  ['Parche Bicicleta Kit', 10, 1816.64, 'seguridad', 'u.'],
  ['Parche Bicicleta N°4 x20u DINI', 5, 3164.27, 'seguridad', 'u.'],
  ['Parche Bicicleta N°5 x18u DINI', 3, 6889.28, 'seguridad', 'u.'],
  ['Camara Bicicleta 26" Pico Gomin T.Terreno', 6, 6546.38, 'seguridad', 'u.'],
]

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  console.log('Conectado a MongoDB')

  const db = client.db('ferreteria-rios')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  // Obtener IDs de categorías
  const cats = await categoriesCol.find({}).toArray()
  const catMap = {}
  cats.forEach(c => { catMap[c.nombre] = c._id })

  console.log('Categorias encontradas:', Object.keys(catMap))

  // Limpiar productos existentes
  await productsCol.deleteMany({})
  console.log('Productos anteriores eliminados')

  const MARGEN = 35 // 35% de margen por defecto

  const productos = PRODUCTOS.map(([nombre, cantidad, precioCosto, catKey, unidad]) => {
    const catNombre = CATEGORIAS[catKey]
    const categoriaId = catMap[catNombre]
    const precioVenta = Math.round(precioCosto * (1 + MARGEN / 100))
    const margen = MARGEN

    return {
      nombre,
      categoria: categoriaId,
      cantidad,
      stockMinimo: 5,
      unidad: unidad || 'u.',
      precioCosto,
      precioVenta,
      margen,
      proveedor: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }).filter(p => p.categoria) // solo los que tienen categoría válida

  const result = await productsCol.insertMany(productos)
  console.log(`✓ ${result.insertedCount} productos cargados correctamente`)

  await client.close()
}

main().catch(console.error)