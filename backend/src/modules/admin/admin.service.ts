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

export const POR_PAGINA = 20

// A URL assinada dos comprovantes vale 5 minutos: o suficiente para abrir o
// arquivo em outra aba, curto o bastante para um link copiado perder a validade
export const VALIDADE_DA_URL_EM_SEGUNDOS = 300

interface Dependencias {
  perfis: Pick<
    PerfisRepository,
    'buscarPorId' | 'listar' | 'contarPorStatus' | 'avaliar'
  >
  comprovantes: Pick<
    ComprovantesRepository,
    'listarPorPerfis' | 'buscarPorId' | 'criarUrlDeLeitura'
  >
  avaliacoes: Pick<AvaliacoesRepository, 'ultimasPorPerfis'>
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

    async aprovar(perfilId: string, avaliadorId: string) {
      await decidir(perfilId, 'aprovado', null, avaliadorId)
      return { status: 'aprovado' as const }
    },

    async recusar(perfilId: string, motivo: string, avaliadorId: string) {
      await decidir(perfilId, 'recusado', motivo, avaliadorId)
      return { status: 'recusado' as const }
    },
  }
}

export type AdminService = ReturnType<typeof criarAdminService>

export const adminService = criarAdminService({
  perfis: perfisRepository,
  comprovantes: comprovantesRepository,
  avaliacoes: avaliacoesRepository,
})
