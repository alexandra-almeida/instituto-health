import { z } from 'zod'

// nome-tamanho-N, em minúsculas e sem acentos (CLAUDE.md); os descartáveis
// começam com desc-
const PADRAO_DE_SKU = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/

export const MAXIMO_DE_SKUS_POR_CONSULTA = 100

// ?skus=a,b,c : lista separada por vírgula, sem repetidos, no máximo 100 (cada
// tela pede só o que mostra; ninguém baixa o catálogo inteiro de uma vez)
export const consultaDePrecosSchema = z.object({
  skus: z
    .string({ error: 'Informe os produtos.' })
    .max(MAXIMO_DE_SKUS_POR_CONSULTA * 100, 'Lista de produtos muito longa.')
    .transform((texto) => [
      ...new Set(
        texto
          .split(',')
          .map((sku) => sku.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(
      z
        .array(z.string().regex(PADRAO_DE_SKU, 'Produto inválido.'))
        .min(1, 'Informe os produtos.')
        .max(
          MAXIMO_DE_SKUS_POR_CONSULTA,
          `No máximo ${MAXIMO_DE_SKUS_POR_CONSULTA} produtos por consulta.`,
        ),
    ),
})

export type ConsultaDePrecosEntrada = z.infer<typeof consultaDePrecosSchema>
