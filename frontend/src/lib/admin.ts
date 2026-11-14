import type { AvaliacaoDoProfissional, StatusDoPerfil } from './api'
import { formatarData } from './conta'

// Funções puras da tela de cadastros (sem React), para poderem ser testadas.

export const POR_PAGINA = 20
export const MOTIVO_MINIMO = 3
export const MOTIVO_MAXIMO = 300
// Espera depois da última letra digitada na busca, para não chamar a API a
// cada tecla
export const ESPERA_DA_BUSCA_EM_MS = 350

export const ABAS: { status: StatusDoPerfil; rotulo: string }[] = [
  { status: 'pendente', rotulo: 'Pendentes' },
  { status: 'aprovado', rotulo: 'Aprovados' },
  { status: 'recusado', rotulo: 'Recusados' },
]

// O link "Cadastros" e a tela só existem para admin. É só interface: a API
// recusa (403) quem não é admin mesmo que alguém abra o endereço à mão.
export function podeVerCadastros(
  perfil: { ehAdmin?: boolean } | null | undefined,
): boolean {
  return perfil?.ehAdmin === true
}

// "Home Care: 12 cadastros", "Home Care: 1 cadastro"
export function contagemDaSecao(nome: string, total: number): string {
  return `${nome}: ${total} ${total === 1 ? 'cadastro' : 'cadastros'}`
}

export function rotuloDaAba(rotulo: string, total: number | undefined): string {
  return total === undefined ? rotulo : `${rotulo} (${total})`
}

// Valida o motivo da recusa como o backend (3 a 300 caracteres sem contar os
// espaços das pontas)
export function motivoDaRecusa(texto: string): {
  valido: boolean
  limpo: string
} {
  const limpo = texto.trim()
  return {
    valido: limpo.length >= MOTIVO_MINIMO && limpo.length <= MOTIVO_MAXIMO,
    limpo,
  }
}

// "1 a 20 de 41" (ou "Nenhum cadastro" quando não há nada)
export function faixaDaPagina(
  pagina: number,
  porPagina: number,
  total: number,
): string {
  if (total === 0) return 'Nenhum cadastro'
  const inicio = (pagina - 1) * porPagina + 1
  const fim = Math.min(total, pagina * porPagina)
  return `${inicio} a ${fim} de ${total}`
}

// "Aprovado por Bia em 14/11/2026"; sem quem decidiu, "Aprovado em ..."
export function rotuloDaAvaliacao(avaliacao: AvaliacaoDoProfissional): string {
  const decisao = avaliacao.decisao === 'aprovado' ? 'Aprovado' : 'Recusado'
  const por = avaliacao.por ? ` por ${avaliacao.por}` : ''
  const data = formatarData(avaliacao.em)
  return `${decisao}${por}${data ? ` em ${data}` : ''}`
}

export function dataOuTraco(iso: string | null): string {
  return (iso && formatarData(iso)) || 'Sem data'
}
