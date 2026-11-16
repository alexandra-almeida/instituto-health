import {
  Atom,
  Citrus,
  ListChecks,
  Paintbrush,
  PersonStanding,
  Pipette,
  SoapDispenserDroplet,
  Star,
  Tag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CHAVE_FILTRO_PROMOCAO } from '../lib/promocao'
import { PROMOCAO_ATUAL } from './promocoes'
import type { TulipiaProduct } from './tulipiaProducts'

export interface VitrineItem {
  key: string
  label: string
  Icon: LucideIcon
  match: (product: TulipiaProduct) => boolean
  /** quando existe, a grade mostra os produtos nesta ordem de sku */
  ordem?: string[]
}

// Linha corporal, por sku e na ordem combinada com a Juliana. Não vem do campo
// `categoria` (que mistura Corporal, Firmeza, Kits, Argilas e Peelings) e não
// muda nenhum sku. Home Care só vê os 2 Firm Flaccid (públicos); Profissional
// vê os 13.
export const SKUS_CORPORAIS = [
  'firm-flaccid-nano-fluido-remineralizante-60ml-2',
  'firm-flaccid-nano-fluido-remineralizante-300ml-4',
  'elegance-nano-dual-peeling-esfoliante-500g-137',
  'moovy-creme-de-massagem-neutro-1kg-142',
  'corpus-mascara-de-argila-amarela-e-colageno-1kg-138',
  'body-hd-creme-de-massagem-redutor-1kg-141',
  'elegance-body-nano-spray-lipotermico-5-em-1-300ml-139',
  'body-hd-gel-hiperemiante-500g-145',
  'body-hd-gel-crioterapico-1kg-144',
  'kit-drenagem-para-tecnicas-de-massagem-corporal-kit-81',
  'ocean-ox-by-ana-julia-graf-flocos-de-magnesio-dermico-3-saches-140',
  'moovy-creme-de-massagem-ozonizado-1kg-143',
  'body-hd-goma-esfoliante-500g-146',
]

// Coleções curadas pra fileira de ícones logo abaixo do banner hero —
// atalhos rápidos, diferentes do filtro "Por Categoria" (que usa as
// categorias cruas do catálogo). Só entram aqui categorias com produto
// real por trás. A ordem segue a da Tulípia; os ícones deles que repetem
// outra página (Sensoriais, Top Skincare) ficam de fora. "Alta Tecnologia" é a
// categoria Ampolas: a Tulípia leva a Lançamentos, que o catálogo não tem.
export const TULIPIA_VITRINE: VitrineItem[] = [
  {
    key: 'mais-vendidos',
    label: 'Mais Vendidos',
    Icon: Star,
    match: (p) => p.destaque,
  },
  {
    // Mesmo filtro da faixa e do banner (a página liga o modo Profissional e
    // ordena pelos skus da promoção); troca sozinho com PROMOCAO_ATUAL.
    key: CHAVE_FILTRO_PROMOCAO,
    label: 'Ofertas do mês',
    Icon: Tag,
    match: (p) => PROMOCAO_ATUAL.skus.includes(p.id),
  },
  {
    key: 'alta-tecnologia',
    label: 'Alta Tecnologia',
    Icon: Atom,
    match: (p) => p.categoria === 'Ampolas',
  },
  {
    key: 'mascaras',
    label: 'Máscaras',
    Icon: Paintbrush,
    match: (p) => p.categoria === 'Máscaras',
  },
  {
    key: 'seruns',
    label: 'Séruns',
    Icon: Pipette,
    match: (p) => p.categoria === 'Séruns',
  },
  {
    key: 'sabonetes',
    label: 'Sabonetes',
    Icon: SoapDispenserDroplet,
    match: (p) => /sabonete/i.test(p.nome),
  },
  {
    key: 'protocolos',
    label: 'Protocolos',
    Icon: ListChecks,
    match: (p) => p.categoria === 'Kits',
  },
  {
    key: 'vitamina-c',
    label: 'Vitamina C',
    Icon: Citrus,
    match: (p) => p.categoria === 'Vitamina C',
  },
  {
    key: 'corporal',
    label: 'Corporal',
    Icon: PersonStanding,
    match: (p) => SKUS_CORPORAIS.includes(p.id),
    ordem: SKUS_CORPORAIS,
  },
]
