import bannerEsquentaBlackGeral from '../assets/tulipia-banners/banner-esquenta-black-geral-01-a-20.webp'
import bannerEsquentaBlackSemana2 from '../assets/tulipia-banners/banner-esquenta-black-semana-2-mascaras-desktop.webp'
import bannerEsquentaBlackSabonetes from '../assets/tulipia-banners/banner-esquenta-black-sabonetes-desktop.webp'
import faixaEsquentaBlackSemana1 from '../assets/tulipia-banners/faixa-esquenta-black-semana-1.webp'
import faixaEsquentaBlackSemana2 from '../assets/tulipia-banners/faixa-esquenta-black-semana-2-mascaras.webp'
import faixaEsquentaBlackSemana3 from '../assets/tulipia-banners/faixa-esquenta-black-semana-3-seruns.webp'
import { estaVigente, promocaoVigente } from '../lib/promocao'

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

// Banner principal. Tem período próprio: o banner geral do Esquenta Black vale
// de 01 a 20 de novembro, mais que cada semana, e filtra os produtos da semana
// vigente.
export interface HeroDaPromocao {
  src: string
  /** proporção real da arte (classe do Tailwind) */
  proporcao: string
  alt: string
  /** primeiro e último dia, 'AAAA-MM-DD' (fuso de São Paulo), inclusive */
  inicio: string
  fim: string
}

export interface Promocao {
  /** primeiro dia da semana da promoção (faixa, filtro e ícone), 'AAAA-MM-DD'
   * (fuso de São Paulo), inclusive */
  inicio: string
  /** último dia da semana da promoção, 'AAAA-MM-DD', inclusive */
  fim: string
  /** texto mostrado em "Mostrando: ..." quando a faixa é clicada */
  rotuloFiltro: string
  /** sku (campo `sku` do catálogo, igual ao `id` do produto) dos itens */
  skus: string[]
  /** texto alternativo da imagem da faixa */
  alt: string
  /** faixa fina, mostrada de 640px para cima; null = sem faixa agora */
  faixa: FaixaDaPromocao | null
  /** banner principal desta promoção */
  hero: HeroDaPromocao
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
  hero: {
    src: bannerEsquentaBlackSabonetes,
    proporcao: 'aspect-[1920/837]',
    alt: 'Esquenta Black 2026: sabonetes com até 30% OFF, de 01 a 08 de novembro',
    inicio: '2026-11-01',
    fim: '2026-11-08',
  },
}

// Banner geral do Esquenta Black (01 a 20 de novembro), o mesmo nas semanas 2 e
// 3. O clique filtra os produtos da semana vigente.
const HERO_ESQUENTA_BLACK_GERAL: HeroDaPromocao = {
  src: bannerEsquentaBlackGeral,
  proporcao: 'aspect-[1920/565]',
  alt: 'Esquenta Black 2026: até 30% OFF, de 01 a 20 de novembro',
  inicio: '2026-11-01',
  fim: '2026-11-20',
}

// Esquenta Black 2026, semana 2: máscaras com até 30% OFF, de 09 a 15 de
// novembro. O banner é o GERAL do Esquenta Black, filtrando os produtos desta
// semana. A faixa fina ficou fora do ar (null) e as artes específicas da semana
// 2 ficam guardadas em `reserva`.
export const PROMO_ESQUENTA_BLACK_SEMANA_2: Promocao = {
  inicio: '2026-11-09',
  fim: '2026-11-15',
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
  alt: 'Esquenta Black 2026: máscaras com até 30% OFF, de 09 a 15 de novembro',
  faixa: null,
  hero: HERO_ESQUENTA_BLACK_GERAL,
  reserva: {
    hero: bannerEsquentaBlackSemana2,
    faixa: { src: faixaEsquentaBlackSemana2, largura: 2720, altura: 340 },
  },
}

// Esquenta Black 2026, semana 3: séruns com até 30% OFF, de 16 a 19 de
// novembro (faixa e filtro). O banner é o geral, que vale até 20/11.
export const PROMO_ESQUENTA_BLACK_SEMANA_3: Promocao = {
  inicio: '2026-11-16',
  fim: '2026-11-19',
  rotuloFiltro: 'Esquenta Black: Séruns até 30% OFF',
  skus: [
    'skin-molecular-serum-de-vitamina-b12-30ml-18',
    'niacine-serum-de-niacinamida-20-30ml-7',
    'immortalite-c-nano-serum-de-vitamina-c-50ml-9',
    'resilience-serum-multirreparador-calmante-50ml-19',
    'dermo-estetic-serum-ultra-calmante-50ml-52',
    'hialux-serum-preenchedor-30ml-124',
    'black-secret-peeling-facial-2-fases-30g-cada-121',
    'age-matte-serum-antioleosidade-50ml-20',
  ],
  alt: 'Esquenta Black 2026: séruns com até 30% OFF, de 16 a 19 de novembro',
  faixa: { src: faixaEsquentaBlackSemana3, largura: 2720, altura: 340 },
  hero: HERO_ESQUENTA_BLACK_GERAL,
}

// Em ordem de data
export const PROMOCOES: Promocao[] = [
  PROMO_ESQUENTA_BLACK_SEMANA_1,
  PROMO_ESQUENTA_BLACK_SEMANA_2,
  PROMO_ESQUENTA_BLACK_SEMANA_3,
]

// O que a página mostra hoje (dias no fuso de São Paulo):
// - `promocao`: o filtro (banner, ícone "Ofertas do mês" e atalho). É a semana
//   vigente; se o banner ainda está no ar mas nenhuma semana vale (20/11), é a
//   última semana que começou;
// - `hero`: o banner principal, só dentro do período dele;
// - `faixa`: a faixa fina, só dentro da semana dela e se ela tiver faixa.
// Fora de tudo, tudo é null e a página não deixa espaço vazio.
export interface OfertaDeHoje {
  promocao: Promocao | null
  hero: HeroDaPromocao | null
  faixa: { arte: FaixaDaPromocao; alt: string } | null
}

export function ofertaDeHoje(agora: Date = new Date()): OfertaDeHoje {
  const semana = promocaoVigente(PROMOCOES, agora)
  const comHero = PROMOCOES.filter((p) => estaVigente(p.hero, agora))
  const heroDe =
    semana && estaVigente(semana.hero, agora) ? semana : comHero.at(-1)
  const promocao = semana ?? heroDe ?? null
  return {
    promocao,
    hero: heroDe?.hero ?? null,
    faixa: semana?.faixa ? { arte: semana.faixa, alt: semana.alt } : null,
  }
}

// A semana configurada mais recente. Só serve de base dos skus do ícone
// "Ofertas do mês" na vitrine; quem decide o que aparece é ofertaDeHoje.
export const PROMOCAO_ATUAL: Promocao = PROMO_ESQUENTA_BLACK_SEMANA_3
