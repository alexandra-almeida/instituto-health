import {
  Atom,
  Citrus,
  ListChecks,
  Paintbrush,
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
}

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
]
