// Promoções da Tulípia exibidas na página /tulipia (faixa e banner principal).
// Sem remoção automática por data; para tirá-las do ar, remova o <PromoStrip />
// e o <PromoHero /> de src/pages/Tulipia.tsx. Para uma nova promoção, copie o
// objeto abaixo, troque os dados e a imagem e aponte os componentes para ele.
export interface Promocao {
  /** texto mostrado em "Mostrando: ..." quando a faixa é clicada */
  rotuloFiltro: string
  /** sku (campo `sku` do catálogo, igual ao `id` do produto) dos itens */
  skus: string[]
  /** texto alternativo da imagem da faixa e do banner */
  alt: string
}

// Esquenta Black 2026, semana 1: sabonetes com até 30% OFF, de 01 a 08 de
// novembro (Ofertas do Mês da Tulípia). A lista é por sku, não por linha, e na
// ordem da Tulípia. Mistura itens com preço público e exclusivos para
// profissionais; por isso o clique da faixa e do banner troca para o modo
// Profissional (ver Tulipia.tsx).
export const PROMO_ESQUENTA_BLACK_SEMANA_1: Promocao = {
  rotuloFiltro: 'Esquenta Black: Sabonetes até 30% OFF',
  skus: [
    'marezi-nano-sabonete-hidratante-300ml-41',
    'citrata-sabonete-liquido-antioleosidade-110ml-40',
    'hialux-sabonete-clareador-110ml-122',
    'black-secret-sabonete-glico-renovador-300ml-114',
    'kit-esteticista-para-limpeza-de-pele-kit-63',
    'dermacos-espuma-de-limpeza-rejuvenescedora-150ml-43',
    'citrata-sabonete-liquido-antioleosidade-300ml-46',
    'kit-peeling-premium-black-secret-kit-76',
    'rotina-anti-idade-espuma-de-limpeza-e-creme-com-pdrn-kit-88',
    'black-secret-peeling-facial-2-fases-30g-cada-121',
    'combo-dermacos-duo-home-care-rejuvenescedor-kit-77',
    'protocolo-antiacne-profissional-kit-protocolo-peeling-antiacne-kit-85',
    'kit-citropeel-peeling-soft-kit-91',
    'rotina-pele-mista-serum-e-sabonete-kit-80',
    'kit-hialux-serum-sabonete-e-creme-kit-98',
    'combo-hialux-serum-e-sabonete-kit-82',
  ],
  alt: 'Esquenta Black 2026: sabonetes com até 30% OFF, de 01 a 08 de novembro',
}
