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
  type UsuarioAutenticado,
} from './auth.client.js'
import type {
  CadastroEntrada,
  ConfirmarEmailEntrada,
  EsqueciSenhaEntrada,
  LoginEntrada,
  RedefinirSenhaEntrada,
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

// Mesma resposta para e-mail com conta e sem conta
const MENSAGEM_RECUPERACAO =
  'Se o e-mail estiver cadastrado, o código chega em instantes. Confira também a caixa de spam.'

type PerfilPublico = Pick<Perfil, 'nome' | 'tipo' | 'status'>

export interface ResultadoDaConfirmacao {
  sessao: Sessao
  usuario: { id: string; email: string }
  perfil: PerfilPublico
}

// Usado pelo middleware `autenticar`. `sessaoRenovada` só vem preenchida
// quando o token de acesso tinha vencido e foi trocado pelo de renovação.
export interface ResultadoDaIdentificacao {
  usuario: UsuarioAutenticado
  perfil: PerfilPublico
  sessaoRenovada?: Sessao
}

function limiteExcedido() {
  return new ErroDeNegocio(
    'muitas_tentativas',
    'Muitas tentativas. Aguarde um pouco e tente de novo.',
    429,
  )
}

const naoAutenticado = () =>
  new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401)

// Só a falha "token não vale mais" é tratada como sessão inexistente; qualquer
// outra (rede, Supabase fora do ar) continua sendo erro de verdade
function sessaoInvalida(erro: unknown) {
  return (
    erro instanceof FalhaDoSupabaseAuth && erro.motivo === 'sessao_invalida'
  )
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

  // Mesma ideia do envio de confirmação: a resposta de "esqueci a senha" não
  // pode depender de a conta existir ou de o envio ter dado certo
  async function enviarRecuperacaoSemFalhar(email: string) {
    try {
      await auth.enviarCodigoDeRecuperacao(email)
    } catch (erro) {
      const codigo =
        erro instanceof FalhaDoSupabaseAuth ? erro.codigoOriginal : 'inesperado'
      console.warn(`Envio do código de recuperação não concluído (${codigo})`)
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

    async entrar(entrada: LoginEntrada): Promise<ResultadoDaConfirmacao> {
      let aberta
      try {
        aberta = await auth.entrar(entrada.email, entrada.senha)
      } catch (erro) {
        if (erro instanceof FalhaDoSupabaseAuth) {
          // Senha errada e e-mail inexistente recebem exatamente a mesma
          // resposta
          if (erro.motivo === 'credenciais_invalidas') {
            throw new ErroDeNegocio(
              'credenciais_invalidas',
              'E-mail ou senha incorretos.',
              401,
            )
          }
          // O Supabase só devolve este erro quando a senha está certa, então
          // não revela a conta a quem não a tem
          if (erro.motivo === 'email_nao_confirmado') {
            throw new ErroDeNegocio(
              'email_nao_confirmado',
              'Confirme seu e-mail para entrar. Use o código que enviamos no cadastro.',
              403,
            )
          }
          if (erro.motivo === 'limite_de_envio') throw limiteExcedido()
        }
        throw erro
      }

      const perfil = await perfis.buscarPorId(aberta.usuario.id)
      if (!perfil) {
        // Conta sem perfil é cadastro interrompido: não abrimos sessão
        throw new Error(`Usuário ${aberta.usuario.id} entrou sem perfil`)
      }

      return {
        sessao: aberta.sessao,
        usuario: aberta.usuario,
        perfil: { nome: perfil.nome, tipo: perfil.tipo, status: perfil.status },
      }
    },

    // Sair nunca falha para quem está saindo: os cookies são limpos pelo
    // controller de qualquer jeito. Se o token já venceu, o Supabase recusa o
    // encerramento e a sessão dele expira sozinha.
    async sair(accessToken?: string) {
      if (!accessToken) return
      try {
        await auth.encerrarSessao(accessToken)
      } catch (erro) {
        const codigo =
          erro instanceof FalhaDoSupabaseAuth
            ? erro.codigoOriginal
            : 'inesperado'
        console.warn(`Encerramento da sessão não concluído (${codigo})`)
      }
    },

    async autenticarSessao({
      accessToken,
      refreshToken,
    }: {
      accessToken?: string
      refreshToken?: string
    }): Promise<ResultadoDaIdentificacao> {
      let usuario: UsuarioAutenticado | undefined
      let sessaoRenovada: Sessao | undefined

      if (accessToken) {
        try {
          usuario = await auth.validarToken(accessToken)
        } catch (erro) {
          if (!sessaoInvalida(erro)) throw erro
        }
      }

      // O cookie de acesso some do navegador quando vence; o de renovação
      // dura mais e é quem reabre a sessão
      if (!usuario && refreshToken) {
        try {
          const renovada = await auth.renovarSessao(refreshToken)
          usuario = renovada.usuario
          sessaoRenovada = renovada.sessao
        } catch (erro) {
          if (!sessaoInvalida(erro)) throw erro
        }
      }

      if (!usuario) throw naoAutenticado()

      const perfil = await perfis.buscarPorId(usuario.id)
      if (!perfil) throw naoAutenticado()

      return {
        usuario,
        perfil: { nome: perfil.nome, tipo: perfil.tipo, status: perfil.status },
        sessaoRenovada,
      }
    },

    async esqueciSenha(entrada: EsqueciSenhaEntrada) {
      await enviarRecuperacaoSemFalhar(entrada.email)
      return { mensagem: MENSAGEM_RECUPERACAO }
    },

    // Troca a senha e encerra todas as sessões; NÃO abre sessão nova, o
    // usuário entra de novo com a senha nova
    async redefinirSenha(entrada: RedefinirSenhaEntrada) {
      try {
        await auth.redefinirSenha(
          entrada.email,
          entrada.codigo,
          entrada.novaSenha,
        )
      } catch (erro) {
        if (erro instanceof FalhaDoSupabaseAuth) {
          if (erro.motivo === 'codigo_invalido') {
            throw new ErroDeNegocio(
              'codigo_invalido',
              'Código inválido ou vencido. Confira os números ou peça um novo código.',
            )
          }
          if (erro.motivo === 'senha_fraca') {
            throw new ErroDeNegocio(
              'senha_fraca',
              'A senha é muito fraca. Use pelo menos 8 caracteres.',
            )
          }
          if (erro.motivo === 'senha_igual') {
            throw new ErroDeNegocio(
              'senha_igual',
              'A nova senha deve ser diferente da atual.',
            )
          }
          if (erro.motivo === 'limite_de_envio') throw limiteExcedido()
        }
        throw erro
      }
      return { mensagem: 'Senha alterada. Entre com a nova senha.' }
    },
  }
}

export type AuthService = ReturnType<typeof criarAuthService>

export const authService = criarAuthService({
  auth: authClient,
  perfis: perfisRepository,
})
