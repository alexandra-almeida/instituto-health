import { createContext } from 'react'
import type { RefObject } from 'react'

export interface NavContextValue {
  /** true assim que a home começa a transição para o header (dispara o
   * fade+slide do "chrome" do menu: fundo, borda, links, carrinho) */
  introFinished: boolean
  setIntroFinished: (value: boolean) => void
  /** true só no instante em que o "voo" do emblema+texto termina — controla
   * a visibilidade do emblema/texto REAIS dentro do header. Fica separado
   * de `introFinished` de propósito: enquanto o overlay ainda está voando
   * até a posição final, o emblema real precisa continuar 100% invisível,
   * senão os dois aparecem sobrepostos por um instante (o "fantasma"
   * duplicado que já vimos com o layoutId). Ele só "acende" no exato
   * instante em que o overlay é removido. */
  brandReady: boolean
  setBrandReady: (value: boolean) => void
  /** refs para os elementos REAIS do emblema e do texto dentro do header —
   * sempre montados (ver Header.tsx), usados pela home só para medir
   * (getBoundingClientRect) a posição/tamanho exatos de destino da
   * transição, sem depender de layoutId/crossfade automático do Motion. */
  brandIconRef: RefObject<HTMLImageElement | null>
  brandTextRef: RefObject<HTMLSpanElement | null>
}

export const NavContext = createContext<NavContextValue | null>(null)
