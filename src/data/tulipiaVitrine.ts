import { Atom, Citrus, ListChecks, Paintbrush, Pipette, SoapDispenserDroplet, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
// real por trás (nada de "Ofertas do Mês" ou "Sensoriais" sem nenhum dado
// que sustente o filtro — ver relatório final).
export const TULIPIA_VITRINE: VitrineItem[] = [
  {
    key: 'mais-vendidos',
    label: 'Mais Vendidos',
    Icon: Star,
    match: (p) => p.destaque,
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
