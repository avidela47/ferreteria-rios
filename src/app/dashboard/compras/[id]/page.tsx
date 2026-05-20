import OrdenDetalle from '@/components/compras/OrdenDetalle'

export default async function OrdenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OrdenDetalle id={id} />
}