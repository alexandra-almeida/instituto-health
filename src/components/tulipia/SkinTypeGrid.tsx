import type { SkinType } from '../../data/skinTypes'

interface SkinTypeGridProps {
  skinTypes: SkinType[]
  onSelect: (skinType: SkinType) => void
}

// Grade de 6 cards com foto real por tipo de pele — cada foto é clicável e
// filtra o grid pro tipo de pele correspondente.
function SkinTypeGrid({ skinTypes, onSelect }: SkinTypeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:gap-4">
      {skinTypes.map((skinType) => (
        <button
          key={skinType.key}
          type="button"
          onClick={() => onSelect(skinType)}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
        >
          <img
            src={skinType.image}
            alt={skinType.label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-verde-profundo/75 via-verde-profundo/10 to-transparent" />
          <span className="font-flatline absolute bottom-2.5 left-3 text-sm leading-tight text-off-white sm:bottom-3 sm:left-4 sm:text-base">
            {skinType.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export default SkinTypeGrid
