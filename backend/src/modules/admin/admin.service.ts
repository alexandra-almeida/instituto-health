import { ErroDeNegocio } from '../../lib/erros.js'
import {
  avaliacoesRepository,
  type AvaliacaoRegistrada,
  type AvaliacoesRepository,
} from '../../repositories/avaliacoes.repository.js'
import {
  comprovantesRepository,
  type ComprovanteRegistrado,
  type ComprovantesRepository,
} from '../../repositories/comprovantes.repository.js'
import {
  perfisRepository,
  type DecisaoSobrePerfil,
  type PerfisRepository,
  type StatusDoPerfil,
} from '../../repositories/perfis.repository.js'
import {
  notificacoes as notificacoesPadrao,
  type Notificacoes,
} from '../notificacoes/notificacoes.service.js'

export const POR_PAGINA = 20

// A URL assinada dos comprovantes vale 5 minutos: o suficiente para abrir o
// arquivo em outra aba, curto o bastante para um link copiado perder a validade
export const VALIDADE_DA_URL_EM_SEGUNDOS = 300

interface Dependencias {
  perfis: Pick<
    PerfisRepository,
    'buscarPorId' | 'buscarContato' | 'listar' | 'contarPorStatus' | 'avaliar'
  >
  comprovantes: Pick<
    ComprovantesRepository,
    'listarPorPerfis' | 'buscarPorId' | 'criarUrlDeLeitura'
  >
  avaliacoes: Pick<AvaliacoesRepository, 'ultimasPorPerfis'>
  notificacoes: Pick<Notificacoes, 'avisarAprovado' | 'avisarRecusado'>
}

export interface Pagina<T> {
  itens: T[]
  total: number
  pagina: number
  porPagina: number
  totalDePaginas: number
}

function paginar<T>(itens: T[], total: number, pagina: number): Pagina<T> {
  return {
    itens,
    total,
    pagina,
    porPagina: POR_PAGINA,
    totalDePaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  }
}

export interface ProfissionalNaTela {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  registroProfissional: string | null
  status: StatusDoPerfil
  criadoEm: string
  /** do mais novo para o mais antigo; o primeiro é o "último comprovante" */
  comprovantes: ComprovanteRegistrado[]
  ultimoComprovanteEm: string | null
  /** a decisão mais recente (em profissional pendente que reenviou, é a
   * recusa anterior) */
  avaliacao: AvaliacaoRegistrada | null
}

export interface HomeCareNaTela {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  criadoEm: string
}

export function criarAdminService({
  perfis,
  comprovantes,
  avaliacoes,
  notificacoes,
}: Dependencias) {
  async function decidir(
    perfilId: string,
    decisao: DecisaoSobrePerfil,
    motivo: string | null,
    avaliadorId: string,
  ) {
    const perfil = await perfis.buscarPorId(perfilId)
    if (!perfil || perfil.tipo !== 'profissional') {
      throw new ErroDeNegocio(
        'cadastro_nao_encontrado',
        'Cadastro não encontrado.',
        404,
      )
    }

    // A troca de status e o histórico acontecem juntos no banco, e só se o
    // cadastro ainda estiver pendente: se duas pessoas decidirem ao mesmo
    // tempo, só a primeira vale
    const decidido = await perfis.avaliar({
      perfilId,
      decisao,
      motivo,
      avaliadorId,
    })
    if (!decidido) {
      throw new ErroDeNegocio(
        'cadastro_ja_avaliado',
        'Este cadastro já foi avaliado. Atualize a lista.',
        409,
      )
    }
    return { perfil, decisao }
  }

  async function avisarSemFalhar(
    tipo: string,
    perfilId: string,
    avisar: (contato: { nome: string; email: string | null }) => Promise<void>,
  ) {
    try {
      const contato = await perfis.buscarContato(perfilId)
      if (contato) await avisar(contato)
    } catch (erro) {
      // Sem nome, e-mail ou motivo no log: só o tipo e o id do cadastro
      const motivo = erro instanceof Error ? erro.message : 'erro inesperado'
      console.error(`Aviso "${tipo}" não enviado (${perfilId}): ${motivo}`)
    }
  }

  return {
    resumo() {
      return perfis.contarPorStatus()
    },

    async listarProfissionais(consulta: {
      status: StatusDoPerfil
      busca?: string
      pagina: number
    }): Promise<Pagina<ProfissionalNaTela>> {
      const { itens, total } = await perfis.listar({
        tipo: 'profissional',
        ...consulta,
        porPagina: POR_PAGINA,
      })
      const ids = itens.map((item) => item.id)
      const [doPerfil, avaliados] = await Promise.all([
        comprovantes.listarPorPerfis(ids),
        avaliacoes.ultimasPorPerfis(ids),
      ])

      return paginar(
        itens.map((item) => {
          const lista = doPerfil.get(item.id) ?? []
          return {
            ...item,
            comprovantes: lista,
            ultimoComprovanteEm: lista[0]?.enviadoEm ?? null,
            avaliacao: avaliados.get(item.id) ?? null,
          }
        }),
        total,
        consulta.pagina,
      )
    },

    // Só consulta, e só o necessário: nome, e-mail, telefone e data
    async listarHomeCare(consulta: {
      busca?: string
      pagina: number
    }): Promise<Pagina<HomeCareNaTela>> {
      const { itens, total } = await perfis.listar({
        tipo: 'homecare',
        ...consulta,
        porPagina: POR_PAGINA,
      })
      return paginar(
        itens.map((item) => ({
          id: item.id,
          nome: item.nome,
          email: item.email,
          telefone: item.telefone,
          criadoEm: item.criadoEm,
        })),
        total,
        consulta.pagina,
      )
    },

    // Nunca o arquivo: só uma URL assinada, de validade curta
    async urlDoComprovante(comprovanteId: string) {
      const comprovante = await comprovantes.buscarPorId(comprovanteId)
      if (!comprovante) {
        throw new ErroDeNegocio(
          'comprovante_nao_encontrado',
          'Comprovante não encontrado.',
          404,
        )
      }
      const url = await comprovantes.criarUrlDeLeitura(
        comprovante.caminho,
        VALIDADE_DA_URL_EM_SEGUNDOS,
      )
      return { url, expiraEmSegundos: VALIDADE_DA_URL_EM_SEGUNDOS }
    },

    // O e-mail ao profissional sai DEPOIS da decisão gravada. Se o envio ou a
    // busca do contato falharem, a decisão continua valendo: só vai para o log
    async aprovar(perfilId: string, avaliadorId: string) {
      await decidir(perfilId, 'aprovado', null, avaliadorId)
      await avisarSemFalhar('aprovado', perfilId, (contato) =>
        notificacoes.avisarAprovado(contato),
      )
      return { status: 'aprovado' as const }
    },

    async recusar(perfilId: string, motivo: string, avaliadorId: string) {
      await decidir(perfilId, 'recusado', motivo, avaliadorId)
      await avisarSemFalhar('recusado', perfilId, (contato) =>
        notificacoes.avisarRecusado(contato, motivo),
      )
      return { status: 'recusado' as const }
    },
  }
}

export type AdminService = ReturnType<typeof criarAdminService>

export const adminService = criarAdminService({
  perfis: perfisRepository,
  comprovantes: comprovantesRepository,
  avaliacoes: avaliacoesRepository,
  notificacoes: notificacoesPadrao,
})
