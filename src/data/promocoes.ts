// Promoções da Tulípia exibidas como faixa na página /tulipia. A faixa
// aparece sempre; para tirá-la do ar, remova o <PromoStrip /> de
// src/pages/Tulipia.tsx. Para uma nova promoção, copie o objeto abaixo e
// troque os textos.
export interface Promocao {
  /** mensagem pré-preenchida no WhatsApp ao clicar na faixa */
  mensagemWhatsapp: string
  /** texto curto da faixa no celular (a imagem fica ilegível em tela estreita) */
  textoMobile: string
  /** texto alternativo da imagem da faixa no computador */
  alt: string
}

// Mês dos Lançamentos, semana 2: 15% OFF em ampolas (Dermo CaHA e ExoGenetic
// PDRN Monodose Facial), de 11 a 18 de outubro de 2026.
export const PROMO_AMPOLAS_SEMANA_2: Promocao = {
  mensagemWhatsapp:
    'Olá! Vi no site a promoção de 15% OFF nas ampolas Tulípia (Dermo CaHA e ExoGenetic PDRN). Gostaria de mais informações.',
  textoMobile: 'Mês dos Lançamentos: 15% OFF em ampolas até 18/10',
  alt: 'Mês dos Lançamentos, semana 2: 15% OFF em ampolas Tulípia, de 11 a 18 de outubro',
}
