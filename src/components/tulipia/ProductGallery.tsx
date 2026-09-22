import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

interface ProductGalleryProps {
  images: string[]
  alt: string
}

// Galeria com foto principal grande + setas/pontos de navegação (quando há
// mais de uma foto) e miniaturas clicáveis abaixo. Usa a prop `key` do
// componente pai (a página de produto passa `key={product.id}`) pra
// resetar o índice sozinha quando o produto muda — sem precisar de efeito
// nem ref pra "resetar" o carrossel.
function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]
  const hasGallery = images.length > 1

  function goToImage(index: number) {
    if (images.length === 0) return
    setActiveIndex((index + images.length) % images.length)
  }

  return (
    // `lg:flex-row-reverse`: no DOM a foto principal continua vindo primeiro
    // (ordem de leitura/foco natural pra quem usa leitor de tela), mas
    // visualmente a coluna de miniaturas aparece à ESQUERDA da foto no
    // desktop, como pedido — sem precisar duplicar/reordenar o JSX.
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4">
      <div className="relative flex h-[34vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15 sm:h-[60vh] lg:h-[70vh] lg:flex-1">
        {activeImage ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={activeImage}
              alt={alt}
              className="h-full w-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </AnimatePresence>
        ) : (
          <span className="p-6 text-center text-base font-medium text-[#04452E]/45 uppercase">
            {alt}
          </span>
        )}

        {hasGallery && (
          <>
            <button
              type="button"
              onClick={() => goToImage(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#04452E] shadow-sm transition-colors hover:text-[#CAA02D]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToImage(activeIndex + 1)}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#04452E] shadow-sm transition-colors hover:text-[#CAA02D]"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas — carrossel horizontal abaixo da foto no mobile, coluna
          vertical à esquerda da foto a partir do lg (ver flex-row-reverse
          acima). A miniatura ativa ganha borda dourada. */}
      {hasGallery && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:h-[70vh] lg:w-20 lg:flex-none lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => goToImage(index)}
              aria-label={`Ir para a foto ${index + 1}`}
              aria-current={index === activeIndex}
              className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-white transition-colors xs:h-20 xs:w-20 lg:h-auto lg:w-full lg:shrink-0 lg:aspect-square ${
                index === activeIndex
                  ? 'border-dourado-health'
                  : 'border-[#04452E]/10'
              }`}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGallery
