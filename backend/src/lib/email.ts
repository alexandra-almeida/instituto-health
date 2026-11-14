import { env } from '../config/env.js'

// Remetente dos avisos (domínio verificado no Resend, ver plano: E-mail)
export const REMETENTE = 'Instituto Health <naoresponda@healthinstituto.com.br>'

export interface MensagemDeEmail {
  para: string
  assunto: string
  texto: string
  html: string
}

// Envia um e-mail pela API do Resend. Sem RESEND_API_KEY não envia nada (só um
// aviso no log), para a API subir e funcionar antes de a chave ser cadastrada.
//
// Em caso de falha lança um erro SEM o corpo da resposta, o endereço nem a
// chave: quem chama (modules/notificacoes) decide o que fazer e registra só o
// tipo do aviso.
export async function enviarEmail(mensagem: MensagemDeEmail): Promise<void> {
  const chave = env.RESEND_API_KEY
  if (!chave) {
    console.warn('RESEND_API_KEY não configurada: o e-mail não foi enviado')
    return
  }

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REMETENTE,
      to: [mensagem.para],
      subject: mensagem.assunto,
      text: mensagem.texto,
      html: mensagem.html,
    }),
    // Um e-mail lento não pode prender a requisição de quem está decidindo
    signal: AbortSignal.timeout(8000),
  })
  if (!resposta.ok) {
    throw new Error(`O Resend respondeu ${resposta.status}`)
  }
}
