import {
  Beaker,
  Citrus,
  Droplet,
  Droplets,
  Eye,
  FlaskConical,
  Heart,
  Layers,
  Package,
  Package2,
  PersonStanding,
  Pipette,
  Scissors,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Sun,
  TestTube,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryMeta {
  Icon: LucideIcon
  /** rótulo curto exibido embaixo do ícone — a categoria "de verdade" (usada
   * no filtro) continua sendo a string completa do catálogo. */
  label: string
}

// Ícones lucide-react (traço fino) por categoria (tipo de produto — lista
// fechada, ver CATEGORIAS em tulipiaProducts.ts), para o carrossel de badges
// circulares em /tulipia. A chave é o nome EXATO da categoria no catálogo.
export const CATEGORY_META: Record<string, CategoryMeta> = {
  Acessórios: { Icon: Package2, label: 'Acessórios' },
  Ampolas: { Icon: TestTube, label: 'Ampolas' },
  Argilas: { Icon: Layers, label: 'Argilas' },
  'Área dos Olhos': { Icon: Eye, label: 'Área dos Olhos' },
  Corporal: { Icon: PersonStanding, label: 'Corporal' },
  Emolientes: { Icon: Droplet, label: 'Emolientes' },
  Firmeza: { Icon: ShieldPlus, label: 'Firmeza' },
  Fotoproteção: { Icon: Sun, label: 'Fotoproteção' },
  Hidratação: { Icon: Droplets, label: 'Hidratação' },
  Kits: { Icon: Package, label: 'Kits' },
  Labial: { Icon: Heart, label: 'Labial' },
  Limpeza: { Icon: Waves, label: 'Limpeza' },
  'Limpeza de Pele': { Icon: ShieldCheck, label: 'Limpeza de Pele' },
  Máscaras: { Icon: Sparkles, label: 'Máscaras' },
  'Peelings e Esfoliantes': { Icon: Scissors, label: 'Peelings' },
  Pomada: { Icon: FlaskConical, label: 'Pomada' },
  Séruns: { Icon: Pipette, label: 'Séruns' },
  Tônicos: { Icon: Beaker, label: 'Tônicos' },
  'Vitamina C': { Icon: Citrus, label: 'Vitamina C' },
}

const FALLBACK_META: CategoryMeta = { Icon: Sparkles, label: '' }

export function getCategoryMeta(categoria: string): CategoryMeta {
  return CATEGORY_META[categoria] ?? { ...FALLBACK_META, label: categoria }
}
