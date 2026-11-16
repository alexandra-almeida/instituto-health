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

// Período de uma promoção: datas no calendário de São Paulo, 'AAAA-MM-DD', e
// os dois extremos entram (o último dia vai até 23h59 de lá).
export interface PeriodoDaPromocao {
  inicio: string
  fim: string
}

const FUSO_DA_LOJA = 'America/Sao_Paulo'

// Dia de hoje em São Paulo, 'AAAA-MM-DD' (o formato en-CA já sai assim). Usa o
// fuso da loja, não o do navegador: quem acessa de fora do Brasil vê a
// promoção começar e acabar na mesma hora que o resto do país.
export function diaEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_DA_LOJA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora)
}

export function estaVigente(
  periodo: PeriodoDaPromocao,
  agora: Date = new Date(),
): boolean {
  const hoje = diaEmSaoPaulo(agora)
  return hoje >= periodo.inicio && hoje <= periodo.fim
}

// A primeira promoção da lista que está no período hoje, ou null. Fora do
// período, hero, faixa e o ícone "Ofertas do mês" somem sozinhos.
export function promocaoVigente<T extends PeriodoDaPromocao>(
  promocoes: T[],
  agora: Date = new Date(),
): T | null {
  return promocoes.find((p) => estaVigente(p, agora)) ?? null
}
