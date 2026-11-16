import bannerEsquentaBlackGeral from '../assets/tulipia-banners/banner-esquenta-black-geral-01-a-20.webp'
import bannerEsquentaBlackSemana2 from '../assets/tulipia-banners/banner-esquenta-black-semana-2-mascaras-desktop.webp'
import bannerEsquentaBlackSabonetes from '../assets/tulipia-banners/banner-esquenta-black-sabonetes-desktop.webp'
import faixaEsquentaBlackSemana1 from '../assets/tulipia-banners/faixa-esquenta-black-semana-1.webp'
import faixaEsquentaBlackSemana2 from '../assets/tulipia-banners/faixa-esquenta-black-semana-2-mascaras.webp'
import { promocaoVigente } from '../lib/promocao'

// Promoções da Tulípia exibidas na página /tulipia (faixa, banner principal e
// ícone "Ofertas do mês"). Cada uma tem início e fim (dias no fuso de São
// Paulo, os dois valem): fora do período, banner, faixa e ícone somem sozinhos,
// sem espaço vazio. Não precisa mexer na página para tirar uma promoção do ar.
//
// PARA TROCAR DE PROMOÇÃO: crie outro objeto com as datas, os skus e as
// imagens e acrescente em PROMOCOES. Faixa, banner, filtro e ícone leem tudo da
// promoção vigente.
export interface FaixaDaPromocao {
  src: string
  /** tamanho real da arte, para a faixa não ser esticada nem cortada */
  largura: number
  altura: number
}

export interface Promocao {
  /** primeiro dia da promoção, 'AAAA-MM-DD' (fuso de São Paulo), inclusive */
  inicio: string
  /** último dia da promoção, 'AAAA-MM-DD' (fuso de São Paulo), inclusive */
  fim: string
  /** texto mostrado em "Mostrando: ..." quando a faixa é clicada */
  rotuloFiltro: string
  /** sku (campo `sku` do catálogo, igual ao `id` do produto) dos itens */
  skus: string[]
  /** texto alternativo da imagem da faixa e do banner */
  alt: string
  /** faixa fina, mostrada de 640px para cima; null = sem faixa agora */
  faixa: FaixaDaPromocao | null
  /** banner principal */
  hero: string
  /** proporção real do banner principal (classe do Tailwind) */
  heroProporcao: string
  /** artes prontas que a promoção ainda não usa (não são exibidas) */
  reserva?: { hero: string; faixa: FaixaDaPromocao }
}

// Esquenta Black 2026, semana 1: sabonetes com até 30% OFF, de 01 a 08 de
// novembro (Ofertas do Mês da Tulípia). A lista é por sku, não por linha, e na
// ordem da Tulípia. Mistura itens com preço público e exclusivos para
// profissionais; por isso o clique da faixa e do banner troca para o modo
// Profissional (ver Tulipia.tsx).
export const PROMO_ESQUENTA_BLACK_SEMANA_1: Promocao = {
  inicio: '2026-11-01',
  fim: '2026-11-08',
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
  faixa: { src: faixaEsquentaBlackSemana1, largura: 2720, altura: 200 },
  hero: bannerEsquentaBlackSabonetes,
  heroProporcao: 'aspect-[1920/837]',
}

// Esquenta Black 2026, semana 2: máscaras com até 30% OFF. O banner é o GERAL
// do Esquenta Black (vale de 01 a 20 de novembro, por isso o período vai até
// 20/11), filtrando os produtos da semana 2. A faixa fina fica fora do ar
// (null) e as artes específicas da semana 2 ficam guardadas em `reserva`.
export const PROMO_ESQUENTA_BLACK_SEMANA_2: Promocao = {
  inicio: '2026-11-01',
  fim: '2026-11-20',
  rotuloFiltro: 'Esquenta Black: Máscaras até 30% OFF',
  skus: [
    'chokola-mascara-de-chocolate-200g-28',
    'marezi-nano-mascara-hidrocalmante-200g-8',
    'life-c-nano-mascara-iluminadora-150g-126',
    'kit-esteticista-para-limpeza-de-pele-kit-63',
    'stellar-mask-mascara-matificante-100g-31',
    'stellar-mask-mascara-rejuvenescedora-100g-33',
    'stellar-mask-mascara-enzimatica-100g-34',
    'stellar-masks-kit-completo-kit-78',
    'black-secret-peeling-facial-2-fases-30g-cada-121',
    'kit-life-c-profissional-kit-90',
  ],
  alt: 'Esquenta Black 2026: até 30% OFF, de 01 a 20 de novembro',
  faixa: null,
  hero: bannerEsquentaBlackGeral,
  heroProporcao: 'aspect-[1920/565]',
  reserva: {
    hero: bannerEsquentaBlackSemana2,
    faixa: { src: faixaEsquentaBlackSemana2, largura: 2720, altura: 340 },
  },
}

// Em ordem de data: a semana 1 vale até 08/11 e a semana 2 cobre o resto do
// período do banner geral.
export const PROMOCOES: Promocao[] = [
  PROMO_ESQUENTA_BLACK_SEMANA_1,
  PROMO_ESQUENTA_BLACK_SEMANA_2,
]

// A promoção no ar hoje (null fora de qualquer período).
export function promocaoDeHoje(agora: Date = new Date()): Promocao | null {
  return promocaoVigente(PROMOCOES, agora)
}

// A promoção configurada mais recente. Só serve de base dos skus do ícone
// "Ofertas do mês" na vitrine; quem decide se aparece é promocaoDeHoje.
export const PROMOCAO_ATUAL: Promocao = PROMO_ESQUENTA_BLACK_SEMANA_2
