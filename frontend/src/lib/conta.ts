import type { PerfilDaConta } from './api'

// Funções puras da página Minha Conta (sem React), para poderem ser testadas.

// Rótulo do tipo e do andamento da conta, como aparece em Minha Conta
export function rotuloDoPerfil(perfil: Pick<PerfilDaConta, 'tipo' | 'status'>) {
  if (perfil.tipo === 'homecare') return 'Home Care'
  switch (perfil.status) {
    case 'pendente':
      return 'Profissional, em análise'
    case 'aprovado':
      return 'Profissional, aprovado'
    case 'recusado':
      return 'Profissional, comprovante não aprovado'
  }
}

// Só profissional que ainda não foi aprovado envia comprovante. É a mesma regra
// do backend (homecare recebe 403 e aprovado recebe 409); aqui só decide se a
// tela mostra o envio.
export function podeEnviarComprovante(
  perfil: Pick<PerfilDaConta, 'tipo' | 'status'>,
) {
  return perfil.tipo === 'profissional' && perfil.status !== 'aprovado'
}

const FORMATO_DE_DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  // O servidor guarda em UTC; a pessoa vê o dia do horário de Brasília
  timeZone: 'America/Sao_Paulo',
})

// "2026-10-22T10:00:00Z" vira "22/10/2026"; data inválida vira null
export function formatarData(iso: string): string | null {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? null : FORMATO_DE_DATA.format(data)
}

// Frase sobre os comprovantes já enviados, ou null se não há nenhum
export function resumoDosEnviados(
  comprovantes: Array<{ enviadoEm: string }>,
): string | null {
  const datas = comprovantes
    .map((c) => new Date(c.enviadoEm))
    .filter((d) => !Number.isNaN(d.getTime()))
  if (comprovantes.length === 0) return null

  // Não depende da ordem em que a API devolveu
  const maisRecente = new Date(Math.max(...datas.map((d) => d.getTime())))
  const quando =
    datas.length > 0 ? ` em ${FORMATO_DE_DATA.format(maisRecente)}` : ''

  return comprovantes.length === 1
    ? `Comprovante enviado${quando}.`
    : `${comprovantes.length} comprovantes enviados, o último${quando}.`
}
