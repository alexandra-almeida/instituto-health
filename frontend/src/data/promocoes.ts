// Promoções da Tulípia exibidas como faixa na página /tulipia. A faixa
// aparece sempre; para tirá-la do ar, remova o <PromoStrip /> de
// src/pages/Tulipia.tsx. Para uma nova promoção, copie o objeto abaixo e
// troque os dados.
export interface Promocao {
  /** texto mostrado em "Mostrando: ..." quando a faixa é clicada */
  rotuloFiltro: string
  /** nomes (campo `nome` do catálogo) dos produtos da promoção */
  produtos: string[]
  /** texto alternativo da imagem da faixa */
  alt: string
}

// Mês dos Lançamentos, semana 2: 15% OFF em ampolas, de 11 a 18 de outubro
// de 2026. Mesmos 3 produtos da página de promoção oficial da Tulípia
// (todos exclusivos para profissionais, sem preço público).
export const PROMO_AMPOLAS_SEMANA_2: Promocao = {
  rotuloFiltro: 'Promoção Mês dos Lançamentos',
  produtos: [
    'Dermo CaHA - Monodose Facial',
    'ExoGenetic PDRN - Monodose Facial',
    'Black Secret - Peeling Facial 2 Fases',
  ],
  alt: 'Mês dos Lançamentos, semana 2: 15% OFF em ampolas Tulípia, de 11 a 18 de outubro',
}
