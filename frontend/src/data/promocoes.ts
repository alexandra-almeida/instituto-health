// Promoções da Tulípia exibidas como faixa na página /tulipia. A faixa
// aparece sempre, sem remoção automática por data; para tirá-la do ar,
// remova o <PromoStrip /> de src/pages/Tulipia.tsx. Para uma nova promoção,
// copie o objeto abaixo e troque os dados.
export interface Promocao {
  /** texto mostrado em "Mostrando: ..." quando a faixa é clicada */
  rotuloFiltro: string
  /** sku (campo `sku` do catálogo, igual ao `id` do produto) dos itens */
  skus: string[]
  /** texto alternativo da imagem da faixa */
  alt: string
}

// Mês dos Lançamentos, semana 3: até 15% OFF, de 19 a 25 de outubro de 2026
// (Ofertas do Mês da Tulípia). A lista é por sku, não por linha; todos os
// itens são exclusivos para profissionais, sem preço público.
export const PROMO_LANCAMENTOS_SEMANA_3: Promocao = {
  rotuloFiltro: 'Mês dos Lançamentos',
  skus: [
    'dermo-estetic-solucao-pos-extracao-50ml-48',
    'dermo-estetic-mascara-nutri-calm-200g-49',
    'dermo-estetic-solucao-ultraemoliente-de-trietanolamina-500ml-51',
    'dermo-estetic-serum-ultra-calmante-50ml-52',
    'dermo-estetic-locao-tonica-antisseptica-300ml-50',
    'kit-linha-dermo-estetic-para-limpeza-de-pele-kit-148',
    'dermo-estetic-sabonete-esfoliante-facial-200ml-53',
    'black-secret-peeling-facial-2-fases-30g-cada-121',
  ],
  alt: 'Mês dos Lançamentos, semana 3: até 15% OFF, de 19 a 25 de outubro',
}
