// Textos dos avisos por e-mail (aprovados pela Alexandra em 14/11/2026). Em
// português, sem travessão. Cada aviso tem versão em texto simples e em HTML
// mínimo; tudo que vem de uma pessoa (nome, motivo) é escapado no HTML.

export const SITE = 'https://healthinstituto.com.br'
export const LINK_DA_TELA_DE_CADASTROS = `${SITE}/admin/cadastros`
export const LINK_DE_MINHA_CONTA = `${SITE}/minha-conta`

// Para a clínica: contato@ (encaminhado ao Gmail)
export const EMAIL_DA_CLINICA = 'contato@healthinstituto.com.br'

export interface TextoDeEmail {
  assunto: string
  texto: string
  html: string
}

export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Quebras de linha dentro de um nome ou motivo não podem bagunçar o e-mail
const umaLinha = (valor: string) => valor.replace(/\s+/g, ' ').trim()

const paragrafo = (conteudo: string) =>
  `<p style="margin:0 0 16px">${conteudo}</p>`

const link = (url: string) => `<a href="${url}">${url}</a>`

function html(paragrafos: string[]): string {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#04452e">' +
    paragrafos.map(paragrafo).join('') +
    '</div>'
  )
}

export function textoDeNovoComprovante(nome: string): TextoDeEmail {
  const quem = umaLinha(nome)
  return {
    assunto: 'Novo profissional aguardando aprovação',
    texto: [
      'Olá,',
      `O cadastro de ${quem} está aguardando aprovação. O comprovante profissional já foi enviado.`,
      `Para analisar, acesse: ${LINK_DA_TELA_DE_CADASTROS}`,
      'Instituto Health',
    ].join('\n\n'),
    html: html([
      'Olá,',
      `O cadastro de ${escaparHtml(quem)} está aguardando aprovação. O comprovante profissional já foi enviado.`,
      `Para analisar, acesse: ${link(LINK_DA_TELA_DE_CADASTROS)}`,
      'Instituto Health',
    ]),
  }
}

export function textoDeAprovado(nome: string): TextoDeEmail {
  const quem = umaLinha(nome)
  return {
    assunto: 'Seu cadastro foi aprovado',
    texto: [
      `Olá, ${quem}.`,
      'Seu cadastro profissional no Instituto Health foi aprovado. Agora sua conta profissional está ativa.',
      `Acessar o site: ${SITE}`,
      'Se tiver qualquer dúvida, fale com a gente pelo WhatsApp.',
      'Equipe Instituto Health',
    ].join('\n\n'),
    html: html([
      `Olá, ${escaparHtml(quem)}.`,
      'Seu cadastro profissional no Instituto Health foi aprovado. Agora sua conta profissional está ativa.',
      `Acessar o site: ${link(SITE)}`,
      'Se tiver qualquer dúvida, fale com a gente pelo WhatsApp.',
      'Equipe Instituto Health',
    ]),
  }
}

export function textoDeRecusado(nome: string, motivo: string): TextoDeEmail {
  const quem = umaLinha(nome)
  const porque = umaLinha(motivo)
  return {
    assunto: 'Não conseguimos aprovar seu cadastro',
    texto: [
      `Olá, ${quem}.`,
      'Não conseguimos aprovar seu cadastro profissional desta vez.',
      `Motivo: ${porque}`,
      `Para tentar de novo, entre na sua conta, abra Minha Conta e envie um novo comprovante: ${LINK_DE_MINHA_CONTA}`,
      'Se preferir, fale com a gente pelo WhatsApp.',
      'Equipe Instituto Health',
    ].join('\n\n'),
    html: html([
      `Olá, ${escaparHtml(quem)}.`,
      'Não conseguimos aprovar seu cadastro profissional desta vez.',
      `Motivo: ${escaparHtml(porque)}`,
      `Para tentar de novo, entre na sua conta, abra Minha Conta e envie um novo comprovante: ${link(LINK_DE_MINHA_CONTA)}`,
      'Se preferir, fale com a gente pelo WhatsApp.',
      'Equipe Instituto Health',
    ]),
  }
}
