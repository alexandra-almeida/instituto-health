import { AnimatePresence, motion } from 'motion/react'
import type { Transition } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useNav } from '../context/useNav'
import BrandIcon from './BrandIcon'
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from './icons'

// Mesma duração/easing da transição final da home (ver TRANSITION_DURATION
// em Home.tsx) — a entrada do header (fade) precisa bater com o "voo" do
// emblema+texto vindo da home para o crossfade ficar limpo.
const HANDOFF_TRANSITION: Transition = { duration: 1, ease: 'easeInOut' }

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/tulipia', label: 'Tulipia' },
  { to: '/produtos-hospitalares', label: 'Descartáveis Para Clínicas' },
  { to: '/procedimentos', label: 'Procedimentos' },
  { to: '/teleconsulta', label: 'Teleconsulta' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/sobre', label: 'Sobre' },
]

function NavLinks({
  className,
  linkClassName,
  onNavigate,
}: {
  className?: string
  linkClassName: string
  onNavigate?: () => void
}) {
  const location = useLocation()
  return (
    <nav className={className} aria-label="Navegação principal">
      {NAV_LINKS.map((link) => {
        const isActive =
          link.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(link.to)
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`${linkClassName} ${isActive ? 'text-gold' : 'text-emerald-dark'}`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

function CartLink() {
  const { itemCount } = useCart()
  return (
    <Link
      to="/carrinho"
      aria-label="Carrinho"
      className="relative shrink-0 rounded-full p-2 text-emerald-dark transition-colors hover:bg-emerald-dark/8"
    >
      <CartIcon className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-emerald-dark">
          {itemCount}
        </span>
      )}
    </Link>
  )
}

// Header global. Fica SEMPRE montado no DOM (em todas as páginas) — na
// home, antes da intro terminar, ele só fica invisível (opacity 0, fora de
// tab-order, sem pointer-events), nunca desmontado. Isso é proposital: a
// home precisa medir a posição/tamanho REAIS do emblema e do texto aqui
// dentro (via brandIconRef/brandTextRef) para animar o "voo" deles até
// este lugar exato — nada de layoutId/crossfade automático, que deixava um
// emblema fantasma duplicado na tela.
function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { introFinished, brandReady, brandIconRef, brandTextRef } = useNav()
  const [mobileOpen, setMobileOpen] = useState(false)

  // `visible` controla o "chrome" do menu (fundo, borda, ícones) — some/
  // aparece só com fade (sem deslocamento, de propósito — ver comentário
  // abaixo). `brandVisible` controla SÓ o emblema+texto reais, de
  // propósito separado: eles ficam 100% invisíveis até o exato instante em
  // que o "voo" do overlay (ver Home.tsx) termina, e então aparecem de uma
  // vez (sem transição própria) — assim nunca coexistem com o overlay, o
  // que era a causa do emblema fantasma duplicado.
  const visible = isHome ? introFinished : true
  const brandVisible = isHome ? brandReady : true

  const navLinkClass =
    'font-poppins text-xs font-medium tracking-wide uppercase transition-colors hover:text-gold whitespace-nowrap'

  return (
    // Só opacity, sem `y`/transform: qualquer deslocamento aqui mudaria a
    // posição medida (getBoundingClientRect) de brandIconRef/brandTextRef
    // enquanto a home ainda está "mirando" no alvo, causando um salto/quique
    // perceptível bem no fim do voo. Com só opacity, a posição do emblema
    // real nunca se move — ela é sempre a posição final de verdade.
    <motion.header
      initial={isHome ? { opacity: 0 } : false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={HANDOFF_TRANSITION}
      aria-hidden={!visible}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className="sticky top-0 z-50 w-full border-b border-emerald-dark/10 bg-offwhite/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-375 items-center justify-between gap-3 px-4 py-3.5 md:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Instituto Health — início"
          tabIndex={visible ? undefined : -1}
          style={{ opacity: brandVisible ? 1 : 0 }}
        >
          <BrandIcon heightPx={54} imgRef={brandIconRef} />
          <span
            ref={brandTextRef}
            className="font-poppins min-w-0 text-[9px] leading-[1.15] font-light tracking-widest text-emerald-dark uppercase xs:text-[10px] sm:truncate sm:text-xs sm:leading-tight sm:whitespace-nowrap"
          >
            {/* No mobile quebra em 2 linhas fixas (sem depender do quanto
                cabe, que variava de aparelho pra aparelho e cortava a
                palavra "INTEGRADA"); a partir do sm volta a ser uma frase
                só, numa linha (ver truncate/whitespace-nowrap acima, que só
                valem a partir daí). */}
            <span className="block sm:inline">Instituto de Saúde</span>
            <span className="hidden sm:inline"> </span>
            <span className="block sm:inline">Integrada</span>
          </span>
        </Link>

        {/* Menu de navegação — só a partir de telas grandes; em telas
            menores vira um menu suspenso (ver botão hambúrguer abaixo). */}
        <NavLinks
          className="hidden items-center gap-5 lg:flex xl:gap-7"
          linkClassName={navLinkClass}
        />

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/cadastro"
            aria-label="Cadastro"
            tabIndex={visible ? undefined : -1}
            className="rounded-full p-2 text-emerald-dark transition-colors hover:bg-emerald-dark/8"
          >
            <UserIcon className="h-6 w-6" />
          </Link>
          <CartLink />

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            tabIndex={visible ? undefined : -1}
            className="rounded-full p-2 text-emerald-dark transition-colors hover:bg-emerald-dark/8 lg:hidden"
          >
            {mobileOpen ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Menu suspenso do mobile — some sozinho ao navegar (onNavigate) ou
          ao clicar de novo no hambúrguer. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-emerald-dark/10 bg-offwhite lg:hidden"
          >
            <NavLinks
              className="flex flex-col gap-1 px-4 py-3 md:px-6"
              linkClassName={`${navLinkClass} rounded-lg px-2 py-2.5 hover:bg-emerald-dark/5`}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Header
