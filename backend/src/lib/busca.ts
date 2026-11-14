// Monta o padrão de uma busca por trecho ("contém") para o filtro `or` do
// PostgREST, a partir do que a pessoa digitou. Duas camadas de cuidado:
//
// 1. LIKE: `%`, `_` e `\` são curingas/escape do próprio LIKE; sem escapá-los,
//    digitar `%` listaria todo mundo.
// 2. Filtro `or`: o valor vai entre aspas duplas, porque vírgula, parênteses e
//    ponto fazem parte da sintaxe do filtro e quebrariam a consulta (ou
//    permitiriam injetar outra condição). Dentro das aspas, `\` e `"` são
//    escapados com `\`.
//
// O termo é cortado em 100 caracteres e perde caracteres de controle.
export const TAMANHO_MAXIMO_DA_BUSCA = 100

export function limparBusca(termo: string | undefined): string | undefined {
  if (termo === undefined) return undefined
  // eslint-disable-next-line no-control-regex
  const limpo = termo.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  if (limpo === '') return undefined
  return limpo.slice(0, TAMANHO_MAXIMO_DA_BUSCA)
}

export function padraoDeBusca(termo: string): string {
  const paraLike = termo.replace(/[\\%_]/g, (c) => `\\${c}`)
  const entreAspas = paraLike.replace(/[\\"]/g, (c) => `\\${c}`)
  return `"%${entreAspas}%"`
}

// Filtro `or` de nome OU e-mail contendo o termo
export function filtroDeBusca(termo: string): string {
  const padrao = padraoDeBusca(termo)
  return `nome.ilike.${padrao},email.ilike.${padrao}`
}
