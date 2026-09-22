import bannerAmpolas from '../assets/tulipia-banners/banner-ampolas.jpg'
import bannerLancamentoExogenetic from '../assets/tulipia-banners/banner-lancamento-exogenetic.webp'
import bannerLinhaDermoEstetic from '../assets/tulipia-banners/banner-linha-dermo-estetic.jpg'
import bannerLinhaProskin from '../assets/tulipia-banners/banner-linha-proskin.jpg'
import type { TulipiaProduct } from './tulipiaProducts'

export interface TulipiaLineBanner {
  key: string
  image: string
  alt: string
  /** proporção real do arquivo (largura/altura), pra não esticar/cortar. */
  aspectClass: string
  capHeight?: boolean
  label: string
  match: (product: TulipiaProduct) => boolean
}

// Banners reais da marca (não mais placeholder de ambientação) — cada um
// intercalado no meio do grid principal, inteiro clicável, levando pros
// produtos da linha/categoria correspondente.
export const TULIPIA_LINE_BANNERS: TulipiaLineBanner[] = [
  {
    key: 'ampolas',
    image: bannerAmpolas,
    alt: 'Ampolas Tulípia',
    aspectClass: 'aspect-[1340/764]',
    label: 'Ampolas',
    match: (p) => p.categoria === 'Ampolas',
  },
  {
    key: 'dermo-estetic',
    image: bannerLinhaDermoEstetic,
    alt: 'Linha Dermo Estetic — para limpeza da pele',
    aspectClass: 'aspect-[1340/764]',
    label: 'Dermo Estetic',
    match: (p) => p.linha === 'Dermo Estetic',
  },
  {
    key: 'proskin',
    image: bannerLinhaProskin,
    alt: 'ProSkin Repair — onde a pele reencontra sua força',
    aspectClass: 'aspect-[1152/1344]',
    capHeight: true,
    label: 'ProSkin Repair',
    match: (p) => p.linha === 'ProSkin Repair',
  },
  {
    key: 'exogenetic',
    image: bannerLancamentoExogenetic,
    alt: 'Lançamento ExoGenetic PDRN',
    aspectClass: 'aspect-[2000/835]',
    label: 'Lançamentos — ExoGenetic PDRN',
    match: (p) => p.linha === 'ExoGenetic PDRN',
  },
]
