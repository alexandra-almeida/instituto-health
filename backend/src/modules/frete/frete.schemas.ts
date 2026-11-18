import { z } from 'zod'

const PADRAO_DE_SKU = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/

export const MAXIMO_DE_LINHAS_NA_COTACAO = 50

// O que o navegador manda para cotar: só o CEP e os produtos. O preço do frete
// vem sempre do servidor (e é calculado de novo ao criar o pedido).
export const cotacaoSchema = z.object({
  cep: z
    .string({ error: 'Informe o CEP.' })
    .transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'CEP inválido.')),
  itens: z
    .array(
      z.object({
        sku: z
          .string({ error: 'Produto inválido.' })
          .regex(PADRAO_DE_SKU, 'Produto inválido.'),
        quantidade: z
          .number({ error: 'Quantidade inválida.' })
          .int('Quantidade inválida.')
          .min(1, 'Quantidade inválida.')
          .max(99, 'Quantidade inválida.'),
      }),
      { error: 'Informe os produtos.' },
    )
    .min(1, 'O carrinho está vazio.')
    .max(
      MAXIMO_DE_LINHAS_NA_COTACAO,
      `No máximo ${MAXIMO_DE_LINHAS_NA_COTACAO} produtos diferentes.`,
    ),
})

export type CotacaoEntrada = z.infer<typeof cotacaoSchema>
