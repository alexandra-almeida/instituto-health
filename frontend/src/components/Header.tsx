import { AnimatePresence, motion } from 'motion/react'
import type { Transition } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useNav } from '../context/useNav'
import BrandIcon from './BrandIcon'
import { primeiroNome } from '../lib/conta'
import { CartIcon, CloseIcon, MenuIcon } from './icons'

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

// Textos da conta, no lugar do antigo ícone de pessoa (ninguém entendia o que
// ele era). Deslogado leva ao cadastro; logado leva a Minha Conta. O texto
// completo ("Cadastre-se" / "Olá, Maria!") só aparece onde há espaço; nos
// demais lugares vai a versão curta ("Entrar" / "Olá!"), que cabe no mesmo
// espaço do ícone de antes e por isso não aperta a marca.
function useContaNoHeader() {
  const { status, perfil } = useAuth()
  const logado = status === 'logado'
  const nome = logado ? primeiroNome(perfil?.nome ?? '') : ''
  return {
    carregando: status === 'carregando',
    logado,
    destino: logado ? '/minha-conta' : '/cadastro',
    curto: logado ? 'Olá!' : 'Entrar',
    completo: logado ? (nome ? `Olá, ${nome}!` : 'Olá!') : 'Cadastre-se',
  }
}

// Mesma altura e largura mínima do botão do carrinho (40 px) e, na versão
// curta, texto de 11 px sem folga lateral: "Entrar" ocupa 39,8 px, ou seja, o
// espaço do ícone. A versão completa (de 480 a 1023 px e a partir de 1280 px)
// ganha folga lateral e texto de 12 px.
const CAIXA_DA_CONTA =
  'font-poppins inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-medium whitespace-nowrap text-emerald-dark xs:max-lg:px-3 xs:max-lg:text-xs xl:px-3 xl:text-xs'

function AccountLink({ visible }: { visible: boolean }) {
  const { carregando, logado, destino, curto, completo } = useContaNoHeader()

  // Enquanto GET /api/auth/eu não responde, reserva o lugar com uma pílula
  // discreta, em vez de mostrar "Entrar" e trocar para "Olá!" logo depois
  if (carregando) {
    return (
      <span aria-hidden="true" className={CAIXA_DA_CONTA}>
        <span className="h-3 w-7 animate-pulse rounded-full bg-emerald-dark/10 xs:max-lg:w-16 xl:w-16" />
      </span>
    )
  }

  return (
    <Link
      to={destino}
      title={logado ? completo : undefined}
      tabIndex={visible ? undefined : -1}
      className={`${CAIXA_DA_CONTA} transition-colors hover:bg-emerald-dark/8`}
    >
      {/* A versão curta aparece abaixo de 480 px e de 1024 a 1279 px; a
          completa, de 480 a 1023 px e a partir de 1280 px. Cada uma é
          escondida com display:none, então só uma entra no nome acessível.
          O nome é cortado em 96 px (cabe "Olá, Alexandra!"): um primeiro
          nome muito longo apertaria a marca em 480 px e a cortaria em 1280 px. */}
      <span className="xs:max-lg:hidden xl:hidden">{curto}</span>
      <span className="hidden max-w-24 truncate xs:max-lg:inline-block xl:inline-block">
        {completo}
      </span>
    </Link>
  )
}

// Primeiro item do menu do celular (abaixo de 480 px), em destaque: ali o
// Header só tem espaço para o texto curto, então o completo vem aqui.
function AccountMenuItem({ onNavigate }: { onNavigate: () => void }) {
  const { carregando, destino, completo } = useContaNoHeader()
  if (carregando) return null
  return (
    <div className="px-4 pt-3 xs:hidden md:px-6">
      <Link
        to={destino}
        onClick={onNavigate}
        className="font-poppins block truncate rounded-lg bg-emerald-dark px-3 py-2.5 text-center text-sm font-medium text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        {completo}
      </Link>
    </div>
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
          <AccountLink visible={visible} />
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
            <AccountMenuItem onNavigate={() => setMobileOpen(false)} />
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
