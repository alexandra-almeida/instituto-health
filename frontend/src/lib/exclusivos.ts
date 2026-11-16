// Aviso mostrado abaixo da grade quando o modo Home Care esconde produtos
// exclusivos de profissionais que o filtro (ou a categoria, linha etc.)
// pegaria.
//
// - nenhum visível e algum escondido: os produtos existem, mas só para
//   profissionais;
// - alguns visíveis e outros escondidos: "Mais N ..." (singular e plural certos);
// - nada escondido: sem aviso (null).
export function avisoDosExclusivos(
  visiveis: number,
  escondidos: number,
): string | null {
  if (escondidos <= 0) return null
  if (visiveis === 0) return 'Estes produtos são exclusivos para profissionais.'
  return escondidos === 1
    ? 'Mais 1 produto exclusivo para profissionais.'
    : `Mais ${escondidos} produtos exclusivos para profissionais.`
}
