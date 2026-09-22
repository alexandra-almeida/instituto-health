import type { LucideIcon } from 'lucide-react'

export interface IconBadgeItem {
  key: string
  label: string
  Icon: LucideIcon
}

interface IconBadgeCarouselProps {
  items: IconBadgeItem[]
  activeKey: string | null
  onSelect: (key: string) => void
}

// Carrossel genérico de badges circulares (contorno dourado, ícone
// lucide-react fino, nome embaixo) — rolagem horizontal manual quando não
// cabem na tela. Estado ativo: círculo preenchido em dourado. Reaproveitado
// tanto pelo filtro "Por Categoria" quanto pela fileira de coleções em
// destaque logo abaixo do banner hero.
function IconBadgeCarousel({ items, activeKey, onSelect }: IconBadgeCarouselProps) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-1 pb-1 xs:gap-4 sm:justify-center sm:gap-6">
      {items.map(({ key, label, Icon }) => {
        const isSelected = key === activeKey
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isSelected}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 xs:w-20"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors xs:h-16 xs:w-16 ${
                isSelected
                  ? 'border-dourado-health bg-dourado-health text-verde-profundo'
                  : 'border-dourado-health/50 text-verde-health hover:border-dourado-health'
              }`}
            >
              <Icon className="h-5 w-5 xs:h-6 xs:w-6" strokeWidth={1.5} />
            </span>
            <span
              className={`text-center text-[10px] leading-tight font-medium xs:text-xs ${
                isSelected ? 'text-dourado-health' : 'text-verde-health/70'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default IconBadgeCarousel
