import { ErroDeNegocio } from '../../lib/erros.js'
import type { ItemPrecificado } from './precificacao.js'

export const ROTULO_DA_RETIRADA = 'Retirada na clínica'

export interface FreteCotado {
  /** rótulo mostrado ao cliente, ex.: "Correios PAC" */
  servicoNome: string
  precoEmCentavos: number
  /** prazo já com o dia útil de postagem */
  prazoMinDias: number
  prazoMaxDias: number
}

// Porta do frete: o módulo de pedidos só conhece esta interface. A cotação real
// (Melhor Envio) entra depois, no módulo `frete` (plano, seção "Frete"), e é
// ligada em `pedidosService` sem mexer em mais nada aqui. O servidor cota DE
// NOVO o serviço escolhido ao criar o pedido; o preço nunca vem do navegador.
export interface CotadorDeFrete {
  cotarServicoEscolhido(entrada: {
    cep: string
    servicoId: number
    itens: ItemPrecificado[]
  }): Promise<FreteCotado>
}

// Enquanto o módulo de frete não existe, só a retirada na clínica funciona
export const cotadorIndisponivel: CotadorDeFrete = {
  async cotarServicoEscolhido() {
    throw new ErroDeNegocio(
      'frete_indisponivel',
      'O envio pelos Correios e transportadoras ainda não está disponível. Escolha retirar na clínica.',
      503,
    )
  },
}
