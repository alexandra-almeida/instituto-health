import { useEffect, useState } from 'react'
import { ArrowUpIcon } from './icons'

// Só aparece depois de rolar um pouco, para não disputar espaço no topo
const LIMITE_DE_ROLAGEM = 400

// Botão flutuante "Voltar ao topo", montado uma vez no App. Fica no canto
// inferior ESQUERDO (o WhatsApp ocupa o direito) e no mesmo z-index dele:
// abaixo do Header e do "voo" da intro da home.
function BackToTop() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    // Só muda o estado ao cruzar o limite (o React ignora valor igual), então
    // rolar não re-renderiza a cada pixel. Não precisa ler a posição na
    // montagem: ao voltar para o topo ou trocar de página o scroll dispara.
    function aoRolar() {
      setVisivel(window.scrollY > LIMITE_DE_ROLAGEM)
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  function voltarAoTopo() {
    // Quem pediu "reduzir movimento" no sistema sobe sem animação. O site não
    // usa essa preferência nas animações do Motion (ver App.tsx), então aqui
    // ela é lida direto.
    const reduzirMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduzirMovimento ? 'instant' : 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={voltarAoTopo}
      aria-label="Voltar ao topo"
      aria-hidden={!visivel}
      tabIndex={visivel ? undefined : -1}
      className={`fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-emerald-dark text-gold shadow-lg transition-all duration-200 hover:bg-gold hover:text-emerald-dark motion-reduce:transition-none sm:bottom-6 sm:left-6 sm:h-12 sm:w-12 ${
        visivel
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  )
}

export default BackToTop
