import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER } from '../data/contact'
import type { ServicoFaqItem, ServicoStep } from '../data/procedimentosDetalhe'
import FadedImage from './FadedImage'
import ScrollReveal from './ScrollReveal'

export interface ServicoPageData {
  slug: string
  title: string
  tagline: string
  heroImage: string
  oQueE: string
  comoFunciona: ServicoStep[]
  paraQuemE: string
  informacoesImportantes: string[]
  faq: ServicoFaqItem[]
  ctaLabel: string
  whatsappMessage: string
}

interface ServicoPageProps {
  data: ServicoPageData
  /** Rótulo + rota do breadcrumb pai (ex: "Procedimentos" → /procedimentos). */
  parentLabel: string
  parentPath: string
}

// Template padrão usado por qualquer página de detalhe de serviço
// (procedimento, curso, teleconsulta específica etc.) — recebe todo o
// conteúdo via `data`, sem nada hardcoded aqui além da estrutura visual.
// Ordem fixa: Hero → O que é → Como funciona → Para quem é → Informações
// importantes → Perguntas frequentes → CTA de agendamento.
function ServicoPage({ data, parentLabel, parentPath }: ServicoPageProps) {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(data.whatsappMessage)}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-emerald-dark/60"
      >
        <Link to={parentPath} className="hover:text-emerald-dark hover:underline">
          {parentLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-emerald-dark">{data.title}</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-40 w-40 sm:h-48 sm:w-48">
          <FadedImage
            src={data.heroImage}
            alt=""
            className="h-full w-full rounded-full"
          />
        </div>
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
          {data.title}
        </h1>
        <p className="max-w-xl text-sm text-emerald-dark/70 sm:text-base">
          {data.tagline}
        </p>
      </div>

      {/* O que é */}
      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
          O que é
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-dark/80 sm:text-base">
          {data.oQueE}
        </p>
      </ScrollReveal>

      {/* Como funciona */}
      <ScrollReveal className="mx-auto mt-14 max-w-3xl">
        <h2 className="font-flatline text-center text-xl text-emerald-dark sm:text-2xl">
          Como funciona
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.comoFunciona.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-dark/10 bg-white p-5 text-center shadow-sm"
            >
              <span className="font-flatline flex h-9 w-9 items-center justify-center rounded-full bg-emerald-dark/8 text-sm text-emerald-dark">
                {index + 1}
              </span>
              <h3 className="font-flatline text-base text-emerald-dark">
                {step.title}
              </h3>
              <p className="text-sm text-emerald-dark/70">{step.description}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Para quem é */}
      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <div className="rounded-2xl bg-champagne/70 p-6 text-center sm:p-8">
          <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
            Para quem é
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-dark/80 sm:text-base">
            {data.paraQuemE}
          </p>
        </div>
      </ScrollReveal>

      {/* Informações importantes */}
      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
          Informações importantes
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm text-emerald-dark/80 marker:text-dourado-health sm:text-base">
          {data.informacoesImportantes.map((info) => (
            <li key={info} className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-dourado-health" />
              <span>{info}</span>
            </li>
          ))}
        </ul>
      </ScrollReveal>

      {/* Perguntas frequentes */}
      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
          Perguntas frequentes
        </h2>
        <div className="mt-4 divide-y divide-emerald-dark/10 rounded-2xl border border-emerald-dark/10 bg-white">
          {data.faq.map((item) => (
            <details key={item.question} className="group p-4 sm:p-5">
              <summary className="font-flatline flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-emerald-dark sm:text-base">
                {item.question}
                <span className="shrink-0 text-emerald-dark/50 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-emerald-dark/70">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </ScrollReveal>

      {/* CTA de agendamento */}
      <div className="mt-14 flex justify-center">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          {data.ctaLabel}
        </a>
      </div>
    </motion.article>
  )
}

export default ServicoPage
