// Chave do filtro da promoção: a mesma para a faixa, o banner e o ícone "Ofertas
// do mês" da vitrine, para o ícone aparecer marcado quando o filtro está ligado.
export const CHAVE_FILTRO_PROMOCAO = 'ofertas-do-mes'

// Põe os produtos na ordem da lista de skus da promoção (a ordem da Tulípia).
// Quem não está na lista vai para o fim, na ordem em que já estava. Não altera
// a lista recebida.
export function ordenarPelosSkus<T extends { id: string }>(
  produtos: T[],
  skus: string[],
): T[] {
  const posicao = new Map(skus.map((sku, indice) => [sku, indice]))
  return [...produtos].sort(
    (a, b) =>
      (posicao.get(a.id) ?? skus.length) - (posicao.get(b.id) ?? skus.length),
  )
}
