import { enviarEmail, type MensagemDeEmail } from '../../lib/email.js'
import {
  EMAIL_DA_CLINICA,
  textoDeAprovado,
  textoDeNovoComprovante,
  textoDeRecusado,
  type TextoDeEmail,
} from './notificacoes.textos.js'

interface Dependencias {
  enviar: (mensagem: MensagemDeEmail) => Promise<void>
}

// Avisos por e-mail. REGRA: nenhum método daqui lança erro. Um e-mail que não
// saiu nunca pode desfazer uma aprovação, uma recusa nem o envio de um
// comprovante: o erro vai para o log só com o TIPO do aviso (nada de endereço,
// nome, motivo, comprovante ou chave).
export function criarNotificacoes({ enviar }: Dependencias) {
  async function avisar(
    tipo: string,
    para: string | null,
    { assunto, texto, html }: TextoDeEmail,
  ) {
    if (!para) {
      console.warn(`Aviso "${tipo}" não enviado: cadastro sem e-mail`)
      return
    }
    try {
      await enviar({ para, assunto, texto, html })
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : 'erro inesperado'
      console.error(`Falha ao enviar o aviso "${tipo}": ${motivo}`)
    }
  }

  return {
    // Para a clínica, quando um comprovante novo é confirmado
    avisarNovoComprovante(nome: string) {
      return avisar(
        'novo comprovante',
        EMAIL_DA_CLINICA,
        textoDeNovoComprovante(nome),
      )
    },

    avisarAprovado(contato: { nome: string; email: string | null }) {
      return avisar('aprovado', contato.email, textoDeAprovado(contato.nome))
    },

    avisarRecusado(
      contato: { nome: string; email: string | null },
      motivo: string,
    ) {
      return avisar(
        'recusado',
        contato.email,
        textoDeRecusado(contato.nome, motivo),
      )
    },
  }
}

export type Notificacoes = ReturnType<typeof criarNotificacoes>

export const notificacoes = criarNotificacoes({ enviar: enviarEmail })
