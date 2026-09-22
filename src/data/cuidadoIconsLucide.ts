import {
  Feather,
  Hourglass,
  Ruler,
  Scissors,
  ShieldCheck,
  ShieldPlus,
  Sun,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CuidadoMeta {
  Icon: LucideIcon
  /** rótulo curto exibido embaixo do ícone no carrossel — o valor "de
   * verdade" (usado no filtro) continua sendo a string completa. */
  label: string
}

// Ícones lucide-react por cuidado (necessidade/objetivo — lista fechada, ver
// CUIDADOS em tulipiaProducts.ts), para o carrossel "Por Cuidado" em
// /tulipia. A chave é o nome EXATO do cuidado no catálogo.
export const CUIDADO_META: Record<string, CuidadoMeta> = {
  'Anti-Idade': { Icon: Hourglass, label: 'Anti-Idade' },
  Antiacne: { Icon: ShieldCheck, label: 'Antiacne' },
  Capilar: { Icon: Scissors, label: 'Capilar' },
  Clareamento: { Icon: Sun, label: 'Clareamento' },
  'Firmeza e Contorno Facial': { Icon: ShieldPlus, label: 'Firmeza' },
  'Pele Sensível/Sensibilizada': { Icon: Feather, label: 'Pele Sensível' },
  'Redução de Medidas e Celulite': { Icon: Ruler, label: 'Medidas/Celulite' },
  'Rugas e Linhas de Expressão': { Icon: Waves, label: 'Rugas' },
}

const FALLBACK_META: CuidadoMeta = { Icon: ShieldCheck, label: '' }

export function getCuidadoMeta(cuidado: string): CuidadoMeta {
  return CUIDADO_META[cuidado] ?? { ...FALLBACK_META, label: cuidado }
}
