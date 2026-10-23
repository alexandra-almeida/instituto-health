import { randomUUID } from 'node:crypto'
import { ErroDeNegocio } from '../../lib/erros.js'
import {
  comprovantesRepository,
  type ComprovanteRegistrado,
  type ComprovantesRepository,
} from '../../repositories/comprovantes.repository.js'
import type {
  StatusDoPerfil,
  TipoDePerfil,
} from '../../repositories/perfis.repository.js'
import {
  BYTES_DA_ASSINATURA,
  conferirAssinatura,
  EXTENSAO_DO_TIPO,
  LIMITE_DE_ARQUIVOS_NA_PASTA,
  LIMITE_DE_REGISTRADOS,
  TAMANHO_MAXIMO_BYTES,
  TIPO_DA_EXTENSAO,
} from './comprovantes.regras.js'
import type {
  ConfirmarEntrada,
  UrlDeEnvioEntrada,
} from './comprovantes.schemas.js'

// Dados do perfil da SESSÃO (carregados pelo middleware `autenticar`), nunca
// do corpo da requisição
export interface PerfilDaSessao {
  id: string
  tipo: TipoDePerfil
  status: StatusDoPerfil
}

interface Dependencias {
  comprovantes: ComprovantesRepository
}

const MENSAGEM_ARQUIVO_INVALIDO =
  'O arquivo enviado não é válido. Envie um JPG, PNG, HEIC ou PDF de até 10 MB.'

function limiteAtingido() {
  return new ErroDeNegocio(
    'limite_de_comprovantes',
    'Você já enviou comprovantes demais. Aguarde a análise ou fale com a gente pelo WhatsApp.',
    429,
  )
}

// Só conta profissional que ainda não foi aprovada envia comprovante: homecare
// não precisa e quem já foi aprovado não tem o que reenviar. Este módulo
// NUNCA altera o status do perfil; aprovar é com a Juliana, pelo painel admin.
function exigirPodeEnviar(perfil: PerfilDaSessao) {
  if (perfil.tipo !== 'profissional') {
    throw new ErroDeNegocio(
      'comprovante_nao_se_aplica',
      'O comprovante é só para contas de profissionais.',
      403,
    )
  }
  if (perfil.status === 'aprovado') {
    throw new ErroDeNegocio(
      'conta_ja_aprovada',
      'Sua conta já foi aprovada. Não é preciso enviar outro comprovante.',
      409,
    )
  }
}

// Caminho que o backend mesmo gerou: <id do perfil>/<uuid>.<extensão>. O id
// do perfil vem da sessão, então um caminho de outra pessoa (ou com "../")
// nunca casa.
function padraoDoCaminho(perfilId: string) {
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  const extensoes = Object.values(EXTENSAO_DO_TIPO).join('|')
  return new RegExp(`^${perfilId}/${uuid}\\.(${extensoes})$`)
}

export function criarComprovantesService({ comprovantes }: Dependencias) {
  // Arquivo que não passou na conferência não deve ficar no bucket
  async function descartar(caminho: string) {
    try {
      await comprovantes.removerArquivo(caminho)
    } catch {
      console.warn('Arquivo de comprovante inválido não foi removido do bucket')
    }
  }

  return {
    async gerarUrlDeEnvio(perfil: PerfilDaSessao, entrada: UrlDeEnvioEntrada) {
      exigirPodeEnviar(perfil)

      const [registrados, naPasta] = await Promise.all([
        comprovantes.contarRegistros(perfil.id),
        comprovantes.contarArquivosNaPasta(perfil.id),
      ])
      if (
        registrados >= LIMITE_DE_REGISTRADOS ||
        naPasta >= LIMITE_DE_ARQUIVOS_NA_PASTA
      ) {
        throw limiteAtingido()
      }

      const caminho = `${perfil.id}/${randomUUID()}.${EXTENSAO_DO_TIPO[entrada.tipo]}`
      const urlDeEnvio = await comprovantes.criarUrlDeEnvio(caminho)
      return { caminho, urlDeEnvio }
    },

    async confirmar(
      perfil: PerfilDaSessao,
      entrada: ConfirmarEntrada,
    ): Promise<{ comprovante: ComprovanteRegistrado; criado: boolean }> {
      exigirPodeEnviar(perfil)

      const { caminho } = entrada
      if (!padraoDoCaminho(perfil.id).test(caminho)) {
        throw new ErroDeNegocio('caminho_invalido', 'Arquivo não reconhecido.')
      }

      // Confirmar duas vezes (clique duplo, nova tentativa de rede) devolve o
      // mesmo registro em vez de erro
      const existente = await comprovantes.buscarPorCaminho(caminho)
      if (existente) return { comprovante: existente, criado: false }

      if (
        (await comprovantes.contarRegistros(perfil.id)) >= LIMITE_DE_REGISTRADOS
      ) {
        throw limiteAtingido()
      }

      // Só grava se o arquivo realmente está no bucket
      const info = await comprovantes.obterInfo(caminho)
      if (!info) {
        throw new ErroDeNegocio(
          'arquivo_nao_encontrado',
          'Não encontramos o arquivo enviado. Tente enviar de novo.',
        )
      }

      // Confere o que o Storage guardou de verdade (não o que o navegador
      // declarou): tamanho, tipo e combinação com a extensão do caminho
      const extensao = caminho.slice(caminho.lastIndexOf('.') + 1)
      const tipoEsperado = TIPO_DA_EXTENSAO[extensao]
      const tipoGuardado = info.tipo.split(';')[0]?.trim().toLowerCase()
      if (
        !tipoEsperado ||
        info.tamanho < 1 ||
        info.tamanho > TAMANHO_MAXIMO_BYTES ||
        tipoGuardado !== tipoEsperado
      ) {
        await descartar(caminho)
        throw new ErroDeNegocio('arquivo_invalido', MENSAGEM_ARQUIVO_INVALIDO)
      }

      // E olha o conteúdo: um HTML rotulado como PDF não passa
      const inicio = await comprovantes.lerPrimeirosBytes(
        caminho,
        BYTES_DA_ASSINATURA,
      )
      if (!conferirAssinatura(tipoEsperado, inicio)) {
        await descartar(caminho)
        throw new ErroDeNegocio('arquivo_invalido', MENSAGEM_ARQUIVO_INVALIDO)
      }

      const comprovante = await comprovantes.inserir(perfil.id, caminho)
      return { comprovante, criado: true }
    },

    async listar(perfilId: string) {
      return { comprovantes: await comprovantes.listarPorPerfil(perfilId) }
    },
  }
}

export type ComprovantesService = ReturnType<typeof criarComprovantesService>

export const comprovantesService = criarComprovantesService({
  comprovantes: comprovantesRepository,
})
