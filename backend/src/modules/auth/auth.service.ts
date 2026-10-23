import { ErroDeNegocio } from '../../lib/erros.js'
import type { Sessao } from '../../lib/cookies.js'
import {
  perfisRepository,
  type Perfil,
  type PerfisRepository,
} from '../../repositories/perfis.repository.js'
import {
  authClient,
  FalhaDoSupabaseAuth,
  type AuthClient,
} from './auth.client.js'
import type {
  CadastroEntrada,
  ConfirmarEmailEntrada,
  ReenviarCodigoEntrada,
} from './auth.schemas.js'

// A mesma resposta para e-mail novo e e-mail já cadastrado, para a API não
// revelar quem tem conta. O texto também serve ao reenvio.
const MENSAGEM_CODIGO_ENVIADO =
  'Se o e-mail puder receber o código, ele chega em instantes. Confira também a caixa de spam.'

interface Dependencias {
  auth: AuthClient
  perfis: PerfisRepository
}

export interface ResultadoDaConfirmacao {
  sessao: Sessao
  usuario: { id: string; email: string }
  perfil: Pick<Perfil, 'nome' | 'tipo' | 'status'>
}

// Fábrica para os testes injetarem o Supabase simulado; a aplicação usa a
// instância `authService` logo abaixo.
export function criarAuthService({ auth, perfis }: Dependencias) {
  // Erros de envio de e-mail nunca mudam a resposta do cadastro/reenvio (para
  // não revelar a conta), então só vão para o log, sem e-mail nem mensagem.
  async function enviarCodigoSemFalhar(email: string) {
    try {
      await auth.enviarCodigoDeConfirmacao(email)
    } catch (erro) {
      const codigo =
        erro instanceof FalhaDoSupabaseAuth ? erro.codigoOriginal : 'inesperado'
      console.warn(`Envio do código de confirmação não concluído (${codigo})`)
    }
  }

  return {
    async cadastrar(entrada: CadastroEntrada) {
      let usuario: { id: string }
      try {
        usuario = await auth.criarUsuario(entrada.email, entrada.senha)
      } catch (erro) {
        if (erro instanceof FalhaDoSupabaseAuth) {
          if (erro.motivo === 'email_existente') {
            // Pode ser alguém que abandonou o cadastro antes de confirmar:
            // reenviamos o código e respondemos como se fosse conta nova.
            // Se a conta já estava confirmada, o Supabase não envia nada.
            await enviarCodigoSemFalhar(entrada.email)
            return { mensagem: MENSAGEM_CODIGO_ENVIADO }
          }
          if (erro.motivo === 'senha_fraca') {
            throw new ErroDeNegocio(
              'senha_fraca',
              'A senha é muito fraca. Use pelo menos 8 caracteres.',
            )
          }
          if (erro.motivo === 'limite_de_envio') {
            throw new ErroDeNegocio(
              'muitas_tentativas',
              'Muitas tentativas. Aguarde um pouco e tente de novo.',
              429,
            )
          }
        }
        throw erro
      }

      // status e tipo saem só daqui: homecare nasce aprovado, profissional
      // pendente. Nada disso vem do corpo da requisição.
      try {
        await perfis.criar({
          id: usuario.id,
          nome: entrada.nome,
          tipo: entrada.perfil,
          status: entrada.perfil === 'homecare' ? 'aprovado' : 'pendente',
        })
      } catch (erro) {
        // Sem perfil a conta não serve: desfaz o usuário para o e-mail não
        // ficar preso a uma conta quebrada
        try {
          await auth.apagarUsuario(usuario.id)
        } catch {
          console.error(
            `Perfil falhou e o usuário ${usuario.id} NÃO foi desfeito: apagar à mão no Supabase`,
          )
        }
        throw erro
      }

      await enviarCodigoSemFalhar(entrada.email)
      return { mensagem: MENSAGEM_CODIGO_ENVIADO }
    },

    async confirmarEmail(
      entrada: ConfirmarEmailEntrada,
    ): Promise<ResultadoDaConfirmacao> {
      let confirmado
      try {
        confirmado = await auth.confirmarCodigo(entrada.email, entrada.codigo)
      } catch (erro) {
        if (erro instanceof FalhaDoSupabaseAuth) {
          if (erro.motivo === 'codigo_invalido') {
            throw new ErroDeNegocio(
              'codigo_invalido',
              'Código inválido ou vencido. Confira os números ou peça um novo código.',
            )
          }
          if (erro.motivo === 'limite_de_envio') {
            throw new ErroDeNegocio(
              'muitas_tentativas',
              'Muitas tentativas. Aguarde um pouco e tente de novo.',
              429,
            )
          }
        }
        throw erro
      }

      const perfil = await perfis.buscarPorId(confirmado.usuario.id)
      if (!perfil) {
        // E-mail confirmado mas sem perfil: não abrimos sessão de uma conta
        // incompleta. Só acontece se o cadastro foi interrompido no meio.
        throw new Error(
          `Usuário ${confirmado.usuario.id} confirmado sem perfil`,
        )
      }

      return {
        sessao: confirmado.sessao,
        usuario: confirmado.usuario,
        perfil: { nome: perfil.nome, tipo: perfil.tipo, status: perfil.status },
      }
    },

    async reenviarCodigo(entrada: ReenviarCodigoEntrada) {
      // Resposta igual exista a conta ou não, e mesmo no intervalo de 60 s do
      // Supabase (o front já bloqueia o botão por esse tempo)
      await enviarCodigoSemFalhar(entrada.email)
      return { mensagem: MENSAGEM_CODIGO_ENVIADO }
    },
  }
}

export type AuthService = ReturnType<typeof criarAuthService>

export const authService = criarAuthService({
  auth: authClient,
  perfis: perfisRepository,
})
