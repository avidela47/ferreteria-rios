#!/bin/bash
# Pasada automática de restyling navy/naranja sobre todo src/app/dashboard y src/components
# No toca globals.css, Sidebar.tsx, layout.tsx ni los archivos del dashboard que ya hicimos a mano.

set -e

FILES=$(find src/app/dashboard src/components -name "*.tsx" \
  -not -path "*/components/ui/*")

for f in $FILES; do
  # 1) Cards: "bg-white rounded-lg shadow-sm" -> esquinas grandes + hover
  sed -i 's/bg-white rounded-lg shadow-sm/bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200/g' "$f"

  # 2) Sacar los bordes de color a la izquierda (border-l-4 border-COLOR-NUM)
  sed -i -E 's/ border-l-4 border-[a-z]+-[0-9]+//g' "$f"

  # 3) Headers de página: text-slate-800 -> navy de marca
  sed -i 's/text-slate-800/text-blue-500/g' "$f"

  # 4) Encabezados de tabla: mismo tono gris claro + línea más sutil
  sed -i 's/text-left text-slate-500 border-b/text-left text-slate-400 border-b border-slate-100/g' "$f"

  # 5) Links "Ver todo" / acciones en azul -> naranja (acento de acción)
  sed -i 's/text-blue-600 hover:underline/text-orange-600 hover:text-orange-700 hover:underline/g' "$f"

  # 6) Inputs y selects: esquinas más redondeadas
  sed -i 's/rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/g' "$f"

  # 7) Resto de rounded-lg sueltos (botones, badges, dropdowns) -> rounded-xl
  sed -i 's/rounded-lg/rounded-xl/g' "$f"

  # 8) font-medium en botones de acción primaria -> font-semibold
  sed -i 's/rounded-xl font-medium cursor-pointer transition-colors/rounded-xl font-semibold cursor-pointer transition-colors/g' "$f"
done

echo "Listo. Revisá 'git diff --stat' para ver cuántos archivos tocó."