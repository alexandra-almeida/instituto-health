import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Sem isso, o React Router preserva a posição de scroll da página anterior
// ao trocar de rota (comportamento normal de SPA) — a pessoa "cai" no meio
// ou no rodapé da página nova, dependendo de onde a anterior estava rolada.
// `behavior: 'instant'` em vez do smooth padrão: é um reset de estado, não
// uma ação que a pessoa deva ver acontecer.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export default ScrollToTop
