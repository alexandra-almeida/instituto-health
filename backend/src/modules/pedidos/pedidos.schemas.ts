import { z } from 'zod'

const PADRAO_DE_SKU = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/

export const MAXIMO_DE_LINHAS = 50

const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')

const texto = (mensagem: string, maximo: number) =>
  z
    .string({ error: mensagem })
    .trim()
    .min(1, mensagem)
    .max(maximo, 'Texto muito longo.')

const item = z.object({
  sku: z
    .string({ error: 'Produto inválido.' })
    .regex(PADRAO_DE_SKU, 'Produto inválido.'),
  quantidade: z
    .number({ error: 'Quantidade inválida.' })
    .int('Quantidade inválida.')
    .min(1, 'Quantidade inválida.')
    .max(99, 'Quantidade inválida.'),
  variacao: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .nullish()
    .transform((v) => v ?? null),
})

const contato = z.object({
  nome: texto('Informe o nome.', 120),
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .max(254, 'E-mail muito longo.')
    .pipe(z.email('E-mail inválido.')),
  telefone: z
    .string({ error: 'Informe o telefone.' })
    .transform(somenteDigitos)
    .pipe(z.string().regex(/^\d{10,11}$/, 'Telefone inválido (DDD e número).')),
})

const endereco = z.object({
  cep: z
    .string({ error: 'Informe o CEP.' })
    .transform(somenteDigitos)
    .pipe(z.string().regex(/^\d{8}$/, 'CEP inválido.')),
  rua: texto('Informe a rua.', 160),
  numero: texto('Informe o número.', 20),
  complemento: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .transform((v) => v || null),
  bairro: texto('Informe o bairro.', 80),
  cidade: texto('Informe a cidade.', 80),
  estado: z
    .string({ error: 'Informe o estado.' })
    .trim()
    .toUpperCase()
    .pipe(
      z.string().regex(/^[A-Z]{2}$/, 'Estado inválido (sigla de 2 letras).'),
    ),
})

const entrega = z.discriminatedUnion(
  'tipo',
  [
    z.object({ tipo: z.literal('retirada') }),
    z.object({
      tipo: z.literal('envio'),
      // o serviço escolhido na cotação; o PREÇO vem sempre do servidor
      servicoId: z.number().int().positive(),
      endereco,
    }),
  ],
  { error: 'Escolha a forma de entrega.' },
)

// O que o navegador pode mandar. Preço, desconto, frete e total NÃO existem
// aqui de propósito: o zod descarta qualquer campo que não esteja declarado.
export const criarPedidoSchema = z.object({
  itens: z
    .array(item, { error: 'Informe os produtos.' })
    .min(1, 'O carrinho está vazio.')
    .max(
      MAXIMO_DE_LINHAS,
      `No máximo ${MAXIMO_DE_LINHAS} produtos diferentes.`,
    ),
  contato,
  entrega,
  formaPagamento: z.enum(['pix', 'credito', 'debito'], {
    error: 'Escolha a forma de pagamento.',
  }),
})

export type CriarPedidoEntrada = z.infer<typeof criarPedidoSchema>

export const idDoPedidoSchema = z.object({
  id: z.uuid({ error: 'Pedido não encontrado.' }),
})
