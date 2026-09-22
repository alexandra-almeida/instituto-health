import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import bgFisioterapiaExplicacao from '../assets/hero-bg/bg-2-fisioterapia-explicacao.jpg'
import bgMassagemFacial from '../assets/hero-bg/bg-3-massagem-facial.jpg'
import diamante from '../assets/logo-parts/diamante.png'
import logoInteira from '../assets/logo-parts/logo-inteira-cropped.png'
import logoNavbar from '../assets/logo-parts/logo-navbar-cropped.png'
import tulipiaIcone from '../assets/tulipia-brand/tulipia-icone-emerald.png'
import tulipiaWordmark from '../assets/tulipia-brand/tulipia-wordmark-final.png'
import BackgroundPhoto from '../components/BackgroundPhoto'
import {
  BodyIcon,
  DrenagemIcon,
  GlowFaceIcon,
  GraduationCapIcon,
  HospitalarIcon,
  JulianaIcon,
  LayersIcon,
  RazorIcon,
  ServicosIcon,
  SyringeIcon,
  TulipiaIcon,
  VideoCallIcon,
} from '../components/icons'
import PriceTag from '../components/PriceTag'
import ScrollReveal from '../components/ScrollReveal'
import { WHATSAPP_NUMBER } from '../data/contact'
import { QUERIDINHOS } from '../data/tulipiaProducts'
import { useNav } from '../context/useNav'

// Sequência de entrada, com stagger progressivo e suave. Ordem: logo →
// subtítulo (começa ainda com a logo em movimento) → divisor (só depois que
// o subtítulo termina) → tagline (só depois que o divisor termina). Toda a
// sequência (logo até o fim da tagline) dura ~1.5s no total — os mesmos
// timings de antes (que somavam ~4.1s), só comprimidos proporcionalmente,
// mantendo o mesmo stagger relativo entre as etapas.
const LOGO_DELAY = 0
const LOGO_DURATION = 0.45

const SUBTITLE_DELAY = LOGO_DELAY + 0.18
const SUBTITLE_DURATION = 0.37
const SUBTITLE_END = SUBTITLE_DELAY + SUBTITLE_DURATION

const DIVIDER_DELAY = SUBTITLE_END + 0.15
const DIVIDER_DURATION = 0.3
const DIVIDER_END = DIVIDER_DELAY + DIVIDER_DURATION

const TAGLINE_DELAY = DIVIDER_END + 0.15
const TAGLINE_DURATION = 0.37

// Pausa com a logo completa parada na tela antes de iniciar a transição
// para o header.
const HOLD_DURATION = 2.0

// Transição final para o header: encolher + mover — a mesma duração/easing
// é usada pelo header (fade) e pelo "voo" do emblema+texto, para que
// tudo termine exatamente junto.
const TRANSITION_DURATION = 1.0
const TRANSITION_EASE = 'easeInOut' as const

// Posição/tamanho do emblema (círculo+H+folhas) *dentro* da imagem
// logo-inteira-cropped.png, em % — calculado a partir da própria imagem.
// Usado só para medir (getBoundingClientRect) onde o emblema aparece
// visualmente ali dentro, e assim o "voo" até o header começar no lugar
// certo — não é mais um elemento com layoutId, só uma âncora de medição.
const ICON_ANCHOR = { left: '26.3%', top: '5.9%', width: '54.3%', height: '63.3%' }

interface Box {
  top: number
  left: number
  width: number
  height: number
}

interface TextBox {
  top: number
  left: number
  fontSize: number
}

interface OverlayRects {
  icon: { from: Box; to: Box }
  text: { from: TextBox; to: TextBox }
}

function boxOf(rect: DOMRect): Box {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}

function textBoxOf(el: HTMLElement): TextBox {
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    fontSize: parseFloat(getComputedStyle(el).fontSize) || 12,
  }
}

// Traço dourado + diamante — mesma animação de sempre (scaleX a partir do
// centro), só que agora mais lenta/suave.
function Divider({ delay }: { delay: number }) {
  return (
    <div
      className="relative flex items-center"
      style={{ width: 'var(--divider-width)', height: 16 }}
    >
      <motion.div
        className="h-0.5 w-full bg-[#CAA02D]"
        style={{ transformOrigin: 'center' }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: DIVIDER_DURATION, delay, ease: 'easeInOut' }}
      />
      <motion.img
        src={diamante}
        alt=""
        className="absolute m-auto block"
        style={{ inset: 0, width: 16, height: 'auto' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: DIVIDER_DURATION * 0.6,
          delay: delay + 0.2,
          ease: 'easeOut',
        }}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-2">
      <div className="h-1 w-12 rounded-full bg-[#CAA02D]" />
      <h2 className="font-serif-display text-2xl leading-tight text-[#04452E] sm:text-3xl">
        {children}
      </h2>
    </div>
  )
}

// Bloco de entrada da home — logo, subtítulo, divisor e tagline. Fica
// inteiro dentro de um único <AnimatePresence>: quando `showFullLogo` vira
// false, TUDO aqui (incluindo o HEALTH embutido na LogoInteira) some com
// fade out e só então é DESMONTADO DE VERDADE do DOM (o `exit` do Motion
// atrasa a remoção até a animação terminar — não é só opacity:0 permanente).
const IntroContent = ({
  iconAnchorRef,
  subtitleRef,
  onTaglineComplete,
}: {
  iconAnchorRef: React.RefObject<HTMLDivElement | null>
  subtitleRef: React.RefObject<HTMLParagraphElement | null>
  onTaglineComplete: () => void
}) => (
  <motion.div
    key="intro-content"
    exit={{ opacity: 0 }}
    transition={{ duration: TRANSITION_DURATION, ease: TRANSITION_EASE }}
    className="flex min-h-screen w-full flex-col items-center justify-start gap-6 overflow-x-hidden overflow-y-hidden px-4 pt-20 pb-12 text-center [--divider-width:140px] [--logo-width:240px] sm:pt-24 sm:[--divider-width:170px] sm:[--logo-width:300px] md:pt-28 md:[--logo-width:380px]"
  >
    <div
      className="relative"
      style={{ width: 'var(--logo-width)', aspectRatio: '935 / 605' }}
    >
      <motion.img
        src={logoInteira}
        alt="Instituto Health"
        className="block h-full w-full"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: LOGO_DURATION, delay: LOGO_DELAY, ease: 'easeOut' }}
      />

      {/* Âncora invisível: existe só para medirmos (getBoundingClientRect)
          onde o emblema aparece visualmente dentro da LogoInteira, no
          instante em que a transição para o header começa. */}
      <div
        ref={iconAnchorRef}
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0"
        style={ICON_ANCHOR}
      />
    </div>

    {/* Subtítulo — desliza da direita, com fade in */}
    <motion.p
      ref={subtitleRef}
      className="font-poppins text-xs font-light text-[#04452E] uppercase tracking-[0.15em] sm:text-sm md:text-base"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: SUBTITLE_DURATION,
        delay: SUBTITLE_DELAY,
        ease: 'easeOut',
      }}
    >
      Instituto de Saúde Integrada
    </motion.p>

    <Divider delay={DIVIDER_DELAY} />

    {/* Tagline — desliza da esquerda, com fade in; ao terminar a entrada,
        avisa (após a pausa) que é hora de iniciar a transição para o header. */}
    <motion.p
      className="font-quicksand max-w-xs text-sm text-[#04452E]/85 sm:max-w-sm sm:text-base"
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: TAGLINE_DURATION, delay: TAGLINE_DELAY, ease: 'easeOut' }}
      onAnimationComplete={onTaglineComplete}
    >
      Conhecimento que cura, cuidado que transforma
    </motion.p>
  </motion.div>
)

// Overlay "voador": emblema + texto em position:fixed, animando das
// coordenadas medidas na home até as coordenadas medidas dentro do header
// de verdade. Some assim que o voo termina, no exato instante em que o
// emblema/texto reais do header ficam visíveis — nunca os dois ao mesmo
// tempo, então não há como sobrepor duas logos.
function HandoffOverlay({
  rects,
  onComplete,
}: {
  rects: OverlayRects
  onComplete: () => void
}) {
  return (
    <>
      <motion.img
        src={logoNavbar}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed z-60 block object-contain"
        initial={{
          top: rects.icon.from.top,
          left: rects.icon.from.left,
          width: rects.icon.from.width,
          height: rects.icon.from.height,
        }}
        animate={{
          top: rects.icon.to.top,
          left: rects.icon.to.left,
          width: rects.icon.to.width,
          height: rects.icon.to.height,
        }}
        transition={{ duration: TRANSITION_DURATION, ease: TRANSITION_EASE }}
        onAnimationComplete={onComplete}
      />
      <motion.span
        aria-hidden="true"
        className="font-poppins pointer-events-none fixed z-60 font-light whitespace-nowrap text-[#04452E] uppercase tracking-[0.12em]"
        initial={{
          top: rects.text.from.top,
          left: rects.text.from.left,
          fontSize: rects.text.from.fontSize,
        }}
        animate={{
          top: rects.text.to.top,
          left: rects.text.to.left,
          fontSize: rects.text.to.fontSize,
        }}
        transition={{ duration: TRANSITION_DURATION, ease: TRANSITION_EASE }}
      >
        Instituto de Saúde Integrada
      </motion.span>
    </>
  )
}

// Largura "full bleed": cancela exatamente o padding horizontal do <main>
// (px-4 / md:px-6 — ver App.tsx) para a foto ocupar toda a largura da
// página (até o max-w-375 do layout), em vez de ficar contida como o
// resto do conteúdo. Usado só nos 2 momentos fotográficos de destaque.
const FULL_BLEED_CLASS = '-mx-4 w-[calc(100%+2rem)] md:-mx-6 md:w-[calc(100%+3rem)]'

// Linha fina dourada — assinatura visual discreta entre seções, no lugar
// de blocos coloridos pesados como separador.
function GoldHairline() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto h-px w-full max-w-xs bg-dourado-health/40 sm:max-w-sm"
    />
  )
}

// ---------------------------------------------------------------------
// 01. Hero — aparece só depois que a animação da logo termina e vira o
// header (mesma lógica de sempre). Reaproveita o vocabulário visual da
// própria intro (emblema + "Health" + divisor com diamante + tagline) em
// vez de um título institucional datilografado, para reforçar a marca
// mesmo depois que a intro já saiu de cena. 1 CTA que rola até "Os 6
// Pilares", logo abaixo.
// ---------------------------------------------------------------------
function HeroSection() {
  function scrollToPilares() {
    document.getElementById('pilares')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="flex flex-col items-center gap-5 py-20 text-center [--divider-width:140px] sm:py-28 sm:[--divider-width:170px]">
      <h1>
        <img
          src={logoInteira}
          alt="Instituto Health"
          className="h-auto w-52 sm:w-64 md:w-72"
        />
      </h1>
      <Divider delay={0.15} />
      <p className="max-w-xl text-sm text-emerald-dark/80 sm:text-base">
        Conhecimento que cura, cuidado que transforma
      </p>
      <button
        type="button"
        onClick={scrollToPilares}
        className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Conhecer o Instituto
      </button>
    </section>
  )
}

// ---------------------------------------------------------------------
// Momento fotográfico 1 — foto grande, cor real (sem filtro), bem sutil
// (opacidade baixa, ver BackgroundPhoto), logo após a visão geral do
// Instituto (Hero + Os 6 Pilares). Full-bleed, com uma citação curta
// sobreposta — só isso, sem mais nada competindo com a foto.
// ---------------------------------------------------------------------
function InstitutoMomentoSection() {
  return (
    <section
      className={`relative h-[60vh] overflow-hidden sm:h-[70vh] ${FULL_BLEED_CLASS}`}
    >
      <BackgroundPhoto
        src={bgMassagemFacial}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.42]"
      />
      <div className="relative flex h-full items-center justify-center px-6 text-center">
        <p className="font-serif-display max-w-2xl text-2xl leading-snug text-verde-health italic sm:text-3xl md:text-4xl">
          Cuidar é unir conhecimento técnico e presença humana em cada gesto.
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 02. Os 6 Pilares — os mesmos 4 cards de antes (Tulipia, Produtos
// Hospitalares) + os 2 novos destinos que substituíram "Serviços"
// (Procedimentos, Teleconsulta, Cursos, Sobre — 4 no total, junto dos 2
// originais, fecham os 6). Cada card agora tem um CTA de texto próprio,
// além do card inteiro já ser clicável.
// ---------------------------------------------------------------------
interface Pilar {
  title?: string
  to: string
  ctaLabel: string
  description: string
  Icon?: typeof TulipiaIcon
  iconSrc?: string
  titleImageSrc?: string
  titleAlt?: string
}

const PILARES: Pilar[] = [
  {
    to: '/tulipia',
    iconSrc: tulipiaIcone,
    titleImageSrc: tulipiaWordmark,
    titleAlt: 'Tulípia',
    description: 'Cosméticos e cuidados de beleza para o dia a dia da sua pele.',
    ctaLabel: 'Conhecer a Tulípia',
  },
  {
    title: 'Descartáveis Para Clínicas',
    to: '/produtos-hospitalares',
    Icon: HospitalarIcon,
    description: 'Equipamentos e insumos hospitalares com qualidade e confiança.',
    ctaLabel: 'Ver produtos',
  },
  {
    title: 'Procedimentos',
    to: '/procedimentos',
    Icon: ServicosIcon,
    description: 'Fisioterapia e estética presencial, com acompanhamento próximo.',
    ctaLabel: 'Conhecer procedimentos',
  },
  {
    title: 'Teleconsulta',
    to: '/teleconsulta',
    Icon: VideoCallIcon,
    description: 'Orientação e acompanhamento por vídeo, sem sair de casa.',
    ctaLabel: 'Agendar teleconsulta',
  },
  {
    title: 'Cursos',
    to: '/cursos',
    Icon: GraduationCapIcon,
    description: 'Capacitação em estética e fisioterapia para profissionais.',
    ctaLabel: 'Conhecer cursos',
  },
  {
    title: 'Sobre a HEALTH',
    to: '/sobre',
    Icon: JulianaIcon,
    description: 'Conheça a fisioterapeuta e esteticista à frente do Instituto.',
    ctaLabel: 'Conhecer a HEALTH',
  },
]

function PilaresSection() {
  return (
    <section id="pilares" className="scroll-mt-20 py-20 sm:py-28">
      <SectionLabel>Os 6 Pilares</SectionLabel>
      <p className="mx-auto mb-10 max-w-xl text-center text-sm text-emerald-dark/70 sm:text-base">
        Seis frentes de cuidado, reunidas em um só lugar.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
        {PILARES.map((card, index) => (
          <ScrollReveal key={card.to} delay={(index % 3) * 0.08}>
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-emerald-dark/10 bg-white/55 p-5 text-center shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg sm:p-6">
              <Link
                to={card.to}
                className="group flex flex-1 flex-col items-center gap-3"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-dark/8 text-emerald-dark group-hover:bg-gold/15 group-hover:text-gold">
                  {card.iconSrc ? (
                    <img
                      src={card.iconSrc}
                      alt=""
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    card.Icon && <card.Icon className="h-7 w-7" />
                  )}
                </span>
                {card.titleImageSrc ? (
                  <img
                    src={card.titleImageSrc}
                    alt={card.titleAlt}
                    className="h-5 w-auto max-w-[70%] object-contain sm:h-6"
                  />
                ) : (
                  <h3 className="font-flatline text-base leading-snug text-emerald-dark">
                    {card.title}
                  </h3>
                )}
                <p className="text-sm text-emerald-dark/70">
                  {card.description}
                </p>
              </Link>
              <Link
                to={card.to}
                className="text-xs font-semibold tracking-wide text-gold uppercase hover:underline"
              >
                {card.ctaLabel} →
              </Link>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 03. Bloco Tulípia — destaque comercial, com produtos reais puxados do
// catálogo (Queridinhos), não mais dados de exemplo.
// ---------------------------------------------------------------------
function TulipiaShowcaseSection() {
  const produtos = QUERIDINHOS.slice(0, 4)

  return (
    <section className="py-20 sm:py-28">
      <SectionLabel>Tulípia</SectionLabel>
      <p className="mx-auto mb-10 max-w-xl text-center text-sm text-emerald-dark/70 sm:text-base">
        Sua rotina de cuidados começa com escolhas inteligentes.
      </p>
      <div className="grid grid-cols-2 gap-3 xs:grid-cols-4 xs:gap-4">
        {produtos.map((produto, index) => (
          <ScrollReveal key={produto.id} delay={(index % 4) * 0.08}>
            <Link
              to={`/tulipia/produto/${produto.id}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]"
            >
              <div className="aspect-square overflow-hidden bg-linear-to-br from-emerald-dark/8 to-gold/15">
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.displayName}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-medium text-emerald-dark/45 uppercase">
                    {produto.displayName}
                  </span>
                )}
              </div>
              <div className="font-inter p-2.5 text-center xs:p-3.5">
                <h3 className="line-clamp-2 text-sm leading-snug font-normal text-verde-health">
                  {produto.displayName}
                </h3>
                <PriceTag
                  value={produto.preco}
                  className="mt-1 leading-none text-verde-health"
                  mainClassName="text-base font-semibold"
                />
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          to="/tulipia"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver loja Tulípia
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 04. Procedimentos — vitrine visual. Ícones próprios (mesmo estilo de
// traço dos outros ícones do site) em vez de uma lib externa, já que o
// site inteiro usa SVGs desenhados à mão (ver components/icons.tsx).
// ---------------------------------------------------------------------
const PROCEDIMENTOS_VITRINE = [
  { label: 'Botox', slug: 'botox', Icon: SyringeIcon },
  { label: 'PEIM', slug: 'peim', Icon: GlowFaceIcon },
  { label: 'Drenagem', slug: 'drenagem', Icon: DrenagemIcon },
  { label: 'Dermaplaning', slug: 'dermaplaning', Icon: RazorIcon },
  { label: 'Peeling Coreano', slug: 'peeling-coreano', Icon: LayersIcon },
  { label: 'Fisioterapia', slug: 'fisioterapia', Icon: BodyIcon },
]

function ProcedimentosShowcaseSection() {
  return (
    <section className="py-20 sm:py-28">
      <SectionLabel>Procedimentos</SectionLabel>
      <p className="mx-auto mb-10 max-w-xl text-center text-sm text-emerald-dark/70 sm:text-base">
        Uma vitrine dos principais procedimentos disponíveis no Instituto.
      </p>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {PROCEDIMENTOS_VITRINE.map(({ label, slug, Icon }, index) => (
          <ScrollReveal key={label} delay={(index % 3) * 0.08}>
            <Link
              to={`/procedimentos/${slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-dark/10 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-dark/8 text-emerald-dark">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="font-flatline text-sm text-emerald-dark">
                {label}
              </h3>
            </Link>
          </ScrollReveal>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          to="/procedimentos"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver todos os procedimentos
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 05. Teleconsulta — destaque forte (aplicação premium: Verde Profundo +
// Dourado Claro), com os 3 passos do atendimento.
// ---------------------------------------------------------------------
const TELECONSULTA_STEPS = [
  {
    step: '1',
    title: 'Avaliação',
    description: 'Entendemos sua pele e sua rotina atual.',
  },
  {
    step: '2',
    title: 'Orientação',
    description: 'Indicações personalizadas para o seu caso.',
  },
  {
    step: '3',
    title: 'Rotina de cuidados',
    description: 'Um plano prático para colocar em ação.',
  },
]

const TELECONSULTA_MESSAGE = 'Olá! Gostaria de agendar uma teleconsulta.'

function TeleconsultaHighlightSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="rounded-2xl bg-verde-profundo px-6 py-12 text-center sm:px-10 sm:py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <div className="h-1 w-12 rounded-full bg-dourado-claro" />
          <h2 className="font-serif-display text-2xl leading-tight text-dourado-claro uppercase sm:text-3xl">
            Teleconsulta HEALTH
          </h2>
          <p className="text-sm text-offwhite/85 sm:text-base">
            Entenda sua pele. Organize sua rotina. Cuide-se com orientação.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          {TELECONSULTA_STEPS.map(({ step, title, description }) => (
            <div key={step} className="flex flex-col items-center gap-2 text-center">
              <span className="font-flatline flex h-12 w-12 items-center justify-center rounded-full border-2 border-dourado-claro text-lg text-dourado-claro">
                {step}
              </span>
              <h3 className="font-flatline text-base text-offwhite">{title}</h3>
              <p className="text-xs text-offwhite/70 sm:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(TELECONSULTA_MESSAGE)}`}
            target="_blank"
            rel="noreferrer"
            className="font-flatline inline-flex items-center justify-center rounded-full bg-dourado-health px-8 py-3 text-sm uppercase leading-none text-verde-profundo transition-colors hover:bg-dourado-claro"
          >
            Agendar teleconsulta
          </a>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 06. Cursos — lista de exemplo até termos a programação real (mesmo
// espírito de "Uma seleção de exemplo" já usado noutras seções da home).
// ---------------------------------------------------------------------
const CURSOS_EXEMPLO = [
  'Curso de Estética Avançada',
  'Workshop de Fisioterapia Dermatofuncional',
  'Formação em Skincare Profissional',
]

function CursosShowcaseSection() {
  return (
    <section className="py-20 sm:py-28">
      <SectionLabel>Cursos</SectionLabel>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-emerald-dark/70 sm:text-base">
        Conhecimento que transforma prática em experiência.
      </p>
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {CURSOS_EXEMPLO.map((curso, index) => (
          <ScrollReveal key={curso} delay={index * 0.08}>
            <div className="flex h-full items-center gap-3 rounded-2xl border border-emerald-dark/10 bg-white p-4 shadow-sm">
              <GraduationCapIcon className="h-6 w-6 shrink-0 text-gold" />
              <span className="font-flatline text-sm text-emerald-dark">
                {curso}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-xl text-center text-xs text-emerald-dark/50 italic">
        Programação de exemplo — fale conosco para saber as próximas turmas.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          to="/cursos"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver cursos
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 07. Produtos Hospitalares — tom técnico/objetivo: categorias + alguns
// produtos de exemplo (a página /produtos-hospitalares ainda não tem
// catálogo próprio implementado, então isso é só uma prévia).
// ---------------------------------------------------------------------
const HOSPITALARES_CATEGORIAS = ['Mobilidade', 'Higiene e Cuidado', 'Equipamentos']

const HOSPITALARES_DESTAQUE = [
  { name: 'Cadeira de Rodas Dobrável', price: 850 },
  { name: 'Kit Curativo Avançado', price: 79.9 },
  { name: 'Colchão Pneumático Anti-escaras', price: 620 },
]

function ProdutosHospitalaresSection() {
  return (
    <section className="py-20 sm:py-28">
      <SectionLabel>Descartáveis Para Clínicas</SectionLabel>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-emerald-dark/70 sm:text-base">
        Qualidade e confiança para cuidados em saúde.
      </p>
      <div className="mx-auto mb-8 flex max-w-xl flex-wrap justify-center gap-2">
        {HOSPITALARES_CATEGORIAS.map((categoria) => (
          <span
            key={categoria}
            className="rounded-full border border-emerald-dark/15 px-3.5 py-1.5 text-xs font-medium tracking-wide text-emerald-dark uppercase"
          >
            {categoria}
          </span>
        ))}
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        {HOSPITALARES_DESTAQUE.map(({ name, price }, index) => (
          <ScrollReveal key={name} delay={index * 0.08}>
            <div className="font-inter flex h-full flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-[0_2px_10px_-2px_rgba(4,32,18,0.12)]">
              <HospitalarIcon className="h-8 w-8 text-emerald-dark/60" />
              <h3 className="text-sm font-normal text-verde-health">{name}</h3>
              <PriceTag
                value={price}
                className="leading-none text-verde-health"
                mainClassName="text-base font-semibold"
              />
            </div>
          </ScrollReveal>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          to="/produtos-hospitalares"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver descartáveis para clínicas
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 08. Sobre a HEALTH — parte humana. Ainda não temos uma foto-retrato da
// Juliana (só as fotos de procedimento já usadas alhures no site);
// reaproveitamos uma delas aqui, mas agora como o FUNDO REAL da própria
// seção (full-bleed, cor real e bem sutil — mesmo tratamento do "momento
// fotográfico 1" acima, pra manter o mesmo peso visual entre as duas).
// ---------------------------------------------------------------------
function AboutHealthSection() {
  return (
    <section className={`relative overflow-hidden ${FULL_BLEED_CLASS}`}>
      <BackgroundPhoto
        src={bgFisioterapiaExplicacao}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.3]"
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h2 className="font-serif-display text-2xl leading-tight text-verde-health sm:text-3xl">
          Conheça quem está por trás da HEALTH
        </h2>
        <p className="max-w-xl text-sm text-verde-health/75 sm:text-base">
          Fisioterapeuta e esteticista, Juliana Gonella também é professora
          na Uniara, unindo prática clínica e formação acadêmica para
          oferecer um cuidado completo — da saúde à estética — com base em
          conhecimento técnico e humanização.
        </p>
        <Link
          to="/sobre"
          className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-dourado-health px-6 py-2.5 text-sm leading-none text-verde-profundo transition-colors hover:bg-dourado-claro"
        >
          Conhecer a história
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// 09. CTA final — os 4 caminhos principais, num bloco de fechamento.
// ---------------------------------------------------------------------
const FINAL_CTA_LINKS = [
  { label: 'Procedimentos', to: '/procedimentos' },
  { label: 'Teleconsulta', to: '/teleconsulta' },
  { label: 'Produtos', to: '/tulipia' },
  { label: 'Cursos', to: '/cursos' },
]

function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-verde-profundo px-6 py-12 text-center sm:px-10 sm:py-16">
        <h2 className="font-serif-display max-w-xl text-2xl leading-tight text-offwhite sm:text-3xl">
          Encontre o cuidado que faz sentido para você.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {FINAL_CTA_LINKS.map((link, index) => (
            <span key={link.to} className="flex items-center gap-3">
              <Link
                to={link.to}
                className="font-flatline text-sm tracking-wide text-dourado-claro uppercase hover:underline"
              >
                {link.label}
              </Link>
              {index < FINAL_CTA_LINKS.length - 1 && (
                <span aria-hidden="true" className="text-offwhite/30">
                  |
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// Marca que a pessoa já viu a animação de entrada nesta ABA/sessão do
// navegador — sessionStorage (não localStorage) porque queremos exatamente
// isso: não repetir a cada navegação de volta pra "/", mas voltar a mostrar
// numa visita nova (aba/navegador fechado e reaberto).
const INTRO_SEEN_KEY = 'health_intro_seen'

function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === 'true'
  } catch {
    // sessionStorage indisponível (ex: navegação privada) — melhor deixar a
    // animação rodar do que arriscar um erro.
    return false
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, 'true')
  } catch {
    // sem sessionStorage a animação só vai repetir a cada visita — não é
    // motivo pra quebrar a navegação.
  }
}

function Home() {
  // Lazy init (roda uma vez, antes do primeiro paint) — decide já na
  // primeira renderização se a animação deve rodar ou se a home nasce
  // direto no estado final, sem nenhum frame intermediário da intro.
  const [skipIntro] = useState(hasSeenIntro)

  // Controla exclusivamente a LogoInteira + subtítulo + divisor + tagline
  // (o bloco de entrada inteiro). Ao virar false, o <AnimatePresence> roda
  // o fade-out e SÓ DEPOIS desmonta o bloco de verdade do DOM.
  const [showFullLogo, setShowFullLogo] = useState(!skipIntro)
  // Overlay fixo (emblema + texto) "voando" da home até o header — só
  // existe durante a própria transição de ~1s.
  const [overlay, setOverlay] = useState<OverlayRects | null>(null)
  // Libera as seções da home depois que a transição termina de vez.
  const [homeReady, setHomeReady] = useState(skipIntro)

  const { setIntroFinished, setBrandReady, brandIconRef, brandTextRef } =
    useNav()
  const iconAnchorRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  // Sempre que a home é montada (inclusive ao voltar de outra página), a
  // animação de entrada roda de novo — então o NavContext (que sobrevive à
  // troca de rota) precisa "esquecer" que o header já tinha aparecido antes.
  // Exceção: quando a intro já foi vista nesta sessão, pula direto pro
  // estado final (header já visível), sem passar por "false" antes —
  // useLayoutEffect roda antes do paint, então não há flash em nenhum caso.
  useLayoutEffect(() => {
    if (skipIntro) {
      setIntroFinished(true)
      setBrandReady(true)
      return
    }
    setIntroFinished(false)
    setBrandReady(false)
  }, [skipIntro, setIntroFinished, setBrandReady])

  function startHandoff() {
    const iconFromEl = iconAnchorRef.current
    const textFromEl = subtitleRef.current
    const iconToEl = brandIconRef.current
    const textToEl = brandTextRef.current

    if (iconFromEl && textFromEl && iconToEl && textToEl) {
      setOverlay({
        icon: {
          from: boxOf(iconFromEl.getBoundingClientRect()),
          to: boxOf(iconToEl.getBoundingClientRect()),
        },
        text: {
          from: textBoxOf(textFromEl),
          to: textBoxOf(textToEl),
        },
      })
    } else {
      // Não deu pra medir (caso extremo) — pula direto pro estado final,
      // sem overlay, em vez de travar a home nesse estado.
      setBrandReady(true)
      setHomeReady(true)
      markIntroSeen()
    }

    // O "chrome" do menu (fundo, borda, links, carrinho) começa a
    // aparecer com fade; a LogoInteira + divisor + tagline começam
    // a sumir com fade out. O emblema+texto REAIS do header continuam
    // invisíveis (brandReady ainda é false) até o overlay terminar de voar.
    setIntroFinished(true)
    setShowFullLogo(false)
  }

  function handleTaglineEntranceComplete() {
    // Entrada completa — mantém a logo parada na tela por um instante antes
    // de iniciar a transição para o header.
    window.setTimeout(startHandoff, HOLD_DURATION * 1000)
  }

  function handleOverlayComplete() {
    // Voo concluído: o overlay some no EXATO instante em que o emblema/texto
    // reais do header acendem (brandReady) — nunca os dois visíveis juntos.
    setOverlay(null)
    setBrandReady(true)
    setHomeReady(true)
    markIntroSeen()
  }

  return (
    <div className="w-full">
      <AnimatePresence>
        {showFullLogo && (
          <IntroContent
            iconAnchorRef={iconAnchorRef}
            subtitleRef={subtitleRef}
            onTaglineComplete={handleTaglineEntranceComplete}
          />
        )}
      </AnimatePresence>

      {overlay && (
        <HandoffOverlay rects={overlay} onComplete={handleOverlayComplete} />
      )}

      {homeReady && (
        <div className="relative">
          <HeroSection />
          <GoldHairline />
          <PilaresSection />

          <InstitutoMomentoSection />

          <TulipiaShowcaseSection />
          <GoldHairline />
          <ProcedimentosShowcaseSection />
          <GoldHairline />
          <TeleconsultaHighlightSection />
          <GoldHairline />
          <CursosShowcaseSection />
          <GoldHairline />
          <ProdutosHospitalaresSection />

          <ScrollReveal>
            <AboutHealthSection />
          </ScrollReveal>

          <GoldHairline />
          <FinalCtaSection />
        </div>
      )}
    </div>
  )
}

export default Home
