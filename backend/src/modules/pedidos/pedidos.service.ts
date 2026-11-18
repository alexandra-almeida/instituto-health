import { ErroDeNegocio } from '../../lib/erros.js'
import { centavosParaNumeric, emCentavos, emReais } from '../../lib/preco.js'
import {
  pedidosRepository,
  type NovoPedido,
  type PedidosRepository,
  type PedidoDoBanco,
  type ResumoDePedido,
} from '../../repositories/pedidos.repository.js'
import {
  perfisRepository,
  type PerfisRepository,
} from '../../repositories/perfis.repository.js'
import {
  produtosRepository,
  type ProdutosRepository,
} from '../../repositories/produtos.repository.js'
import {
  cotadorIndisponivel,
  ROTULO_DA_RETIRADA,
  type CotadorDeFrete,
} from './entrega.js'
import type { CriarPedidoEntrada } from './pedidos.schemas.js'
import { juntarItensRepetidos, precificarPedido } from './precificacao.js'

export interface UsuarioDaSessao {
  id: string
}

export interface PedidoCriado {
  id: string
  numero: number
  status: 'aguardando_pagamento'
  formaPagamento: string
  subtotal: number
  frete: number
  total: number
  entrega: {
    tipo: 'envio' | 'retirada'
    servico: string
    prazoMinDias: number | null
    prazoMaxDias: number | null
  }
  itens: Array<{
    sku: string
    nome: string
    variacao: string | null
    quantidade: number
    precoUnitario: number
  }>
}

const naoEncontrado = () =>
  new ErroDeNegocio('pedido_nao_encontrado', 'Pedido não encontrado.', 404)

const dinheiro = (valor: number | string) => emReais(emCentavos(valor))

function resumo(pedido: ResumoDePedido) {
  return {
    id: pedido.id,
    numero: Number(pedido.numero),
    status: pedido.status,
    formaPagamento: pedido.forma_pagamento,
    subtotal: dinheiro(pedido.subtotal),
    frete: dinheiro(pedido.frete),
    total: dinheiro(pedido.total),
    entrega: { tipo: pedido.entrega_tipo, servico: pedido.frete_servico },
    codigoDeRastreio: pedido.codigo_rastreio,
    criadoEm: pedido.created_at,
  }
}

function detalhe(pedido: PedidoDoBanco) {
  return {
    ...resumo(pedido),
    itens: pedido.itens_pedido.map((item) => ({
      sku: item.sku,
      nome: item.nome,
      variacao: item.variacao,
      quantidade: item.quantidade,
      precoUnitario: dinheiro(item.preco_unitario),
    })),
  }
}

interface Dependencias {
  produtos: Pick<ProdutosRepository, 'buscarParaPedido'>
  pedidos: PedidosRepository
  perfis: Pick<PerfisRepository, 'buscarPorId'>
  cotador: CotadorDeFrete
}

export function criarPedidosService({
  produtos,
  pedidos,
  perfis,
  cotador,
}: Dependencias) {
  return {
    // Cria um pedido em `aguardando_pagamento`. Todos os valores saem do
    // servidor: o subtotal, o desconto do profissional e o frete. Compra sem
    // cadastro vale (visitante: preço público). Quem decide se o preço é o de
    // profissional é o BANCO (perfil aprovado), nunca a sessão em cache nem o
    // navegador. Ainda não há pagamento: isso entra depois do meio de pagamento.
    async criar(
      entrada: CriarPedidoEntrada,
      usuario?: UsuarioDaSessao,
    ): Promise<PedidoCriado> {
      const perfil = usuario ? await perfis.buscarPorId(usuario.id) : null
      const profissionalAprovado =
        perfil?.tipo === 'profissional' && perfil.status === 'aprovado'

      const itens = juntarItensRepetidos(
        entrada.itens.map((i) => ({
          sku: i.sku,
          quantidade: i.quantidade,
          variacao: i.variacao,
        })),
      )
      const doBanco = await produtos.buscarParaPedido([
        ...new Set(itens.map((i) => i.sku)),
      ])
      const precificacao = precificarPedido(
        itens,
        doBanco,
        profissionalAprovado,
      )

      // Frete: retirada é grátis; envio cota de novo o serviço escolhido
      const { entrega } = entrada
      let freteEmCentavos = 0
      let servico = ROTULO_DA_RETIRADA
      let prazoMin: number | null = null
      let prazoMax: number | null = null
      if (entrega.tipo === 'envio') {
        const cotado = await cotador.cotarServicoEscolhido({
          cep: entrega.endereco.cep,
          servicoId: entrega.servicoId,
          itens: precificacao.itens,
        })
        freteEmCentavos = cotado.precoEmCentavos
        servico = cotado.servicoNome
        prazoMin = cotado.prazoMinDias
        prazoMax = cotado.prazoMaxDias
      }
      const totalEmCentavos = precificacao.subtotalEmCentavos + freteEmCentavos

      const endereco = entrega.tipo === 'envio' ? entrega.endereco : null
      const novo: NovoPedido = {
        perfil_id: usuario?.id ?? null,
        email: entrada.contato.email,
        tabela_de_precos: precificacao.tabelaDePrecos,
        forma_pagamento: entrada.formaPagamento,
        subtotal: centavosParaNumeric(precificacao.subtotalEmCentavos),
        frete: centavosParaNumeric(freteEmCentavos),
        total: centavosParaNumeric(totalEmCentavos),
        frete_servico: servico,
        frete_servico_id: entrega.tipo === 'envio' ? entrega.servicoId : null,
        frete_prazo_min: prazoMin,
        frete_prazo_max: prazoMax,
        entrega_tipo: entrega.tipo,
        entrega_nome: entrada.contato.nome,
        entrega_telefone: entrada.contato.telefone,
        entrega_cep: endereco?.cep ?? null,
        entrega_rua: endereco?.rua ?? null,
        entrega_numero: endereco?.numero ?? null,
        entrega_complemento: endereco?.complemento ?? null,
        entrega_bairro: endereco?.bairro ?? null,
        entrega_cidade: endereco?.cidade ?? null,
        entrega_estado: endereco?.estado ?? null,
      }
      const { id, numero } = await pedidos.criar(
        novo,
        precificacao.itens.map((item) => ({
          sku: item.sku,
          nome: item.nome,
          variacao: item.variacao,
          quantidade: item.quantidade,
          preco_unitario: centavosParaNumeric(item.precoUnitarioEmCentavos),
        })),
      )

      return {
        id,
        numero,
        status: 'aguardando_pagamento',
        formaPagamento: entrada.formaPagamento,
        subtotal: emReais(precificacao.subtotalEmCentavos),
        frete: emReais(freteEmCentavos),
        total: emReais(totalEmCentavos),
        entrega: {
          tipo: entrega.tipo,
          servico,
          prazoMinDias: prazoMin,
          prazoMaxDias: prazoMax,
        },
        itens: precificacao.itens.map((item) => ({
          sku: item.sku,
          nome: item.nome,
          variacao: item.variacao,
          quantidade: item.quantidade,
          precoUnitario: emReais(item.precoUnitarioEmCentavos),
        })),
      }
    },

    // Só o dono do pedido (ou um admin) vê. Para qualquer outra pessoa, e para
    // pedido de visitante, a resposta é a mesma de "não existe" (404), para
    // ninguém descobrir números de pedido.
    async buscar(id: string, usuario: UsuarioDaSessao) {
      const pedido = await pedidos.buscarPorId(id)
      if (!pedido) throw naoEncontrado()
      if (pedido.perfil_id !== usuario.id) {
        const perfil = await perfis.buscarPorId(usuario.id)
        if (!perfil?.is_admin) throw naoEncontrado()
      }
      return detalhe(pedido)
    },

    async listar(usuario: UsuarioDaSessao) {
      const lista = await pedidos.listarDoPerfil(usuario.id)
      return { pedidos: lista.map(resumo) }
    },
  }
}

export type PedidosService = ReturnType<typeof criarPedidosService>

export const pedidosService = criarPedidosService({
  produtos: produtosRepository,
  pedidos: pedidosRepository,
  perfis: perfisRepository,
  cotador: cotadorIndisponivel,
})
