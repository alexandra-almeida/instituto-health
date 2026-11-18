// Prazo de postagem decidido com a Juliana em 16/11/2026: a Bia posta em até 1
// dia útil depois do pagamento; o cliente vê o prazo da transportadora MAIS esse
// dia.
export const DIAS_UTEIS_DE_POSTAGEM = 1

export function somarDiaDePostagem(prazo: { min: number; max: number }) {
  return {
    min: prazo.min + DIAS_UTEIS_DE_POSTAGEM,
    max: prazo.max + DIAS_UTEIS_DE_POSTAGEM,
  }
}

// A "válvula" so_retirada (produtos_logistica): ligada à mão só se algum
// transportador recusar um produto específico. Por padrão é sempre false, então
// por padrão TODO produto pode ser enviado. Devolve os skus que a ligaram.
export function skusSoComRetirada(
  linhas: ReadonlyArray<{ sku: string; so_retirada: boolean }>,
): string[] {
  return linhas.filter((l) => l.so_retirada).map((l) => l.sku)
}
