import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER } from '../data/contact'
import { CATEGORIA_IMAGEM } from '../data/procedimentos'
import type { Procedimento } from '../data/procedimentos'
import FadedImage from './FadedImage'
import ScrollReveal from './ScrollReveal'

interface ServicoPageProps {
  data: Procedimento
  /** Rótulo + rota do breadcrumb pai (ex: "Procedimentos" → /procedimentos). */
  parentLabel: string
  parentPath: string
}

// Template de página de detalhe de procedimento — usado só por
// ProcedimentoDetalhe.tsx hoje. Estrutura fixa: breadcrumb → hero (foto +
// categoria + nome) → Descrição → Indicações → Objetivos → Informações
// importantes → Atenção (destaque âmbar, info de segurança) → Possíveis
// intercorrências → CTA de agendamento. Cada seção só aparece se o
// procedimento tiver o campo correspondente preenchido.
function ServicoPage({ data, parentLabel, parentPath }: ServicoPageProps) {
  const whatsappMessage = `Olá! Gostaria de agendar uma avaliação para ${data.nome}.`
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`

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
        <span className="text-emerald-dark">{data.nome}</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-40 w-40 sm:h-48 sm:w-48">
          <FadedImage
            src={CATEGORIA_IMAGEM[data.categoria]}
            alt=""
            className="h-full w-full rounded-full"
          />
        </div>
        <span className="text-xs font-semibold tracking-wide text-dourado-health uppercase">
          {data.categoria}
        </span>
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
          {data.nome}
        </h1>
        {!data.completo && (
          <p className="max-w-xl text-xs text-emerald-dark/50 italic">
            Conteúdo completo em breve.
          </p>
        )}
      </div>

      {/* Descrição */}
      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
          Descrição
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-dark/80 sm:text-base">
          {data.descricao}
        </p>
      </ScrollReveal>

      {/* Indicações */}
      {data.indicacoes && data.indicacoes.length > 0 && (
        <ScrollReveal className="mx-auto mt-14 max-w-2xl">
          <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
            Indicações
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-emerald-dark/80 sm:text-base">
            {data.indicacoes.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-dourado-health" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}

      {/* Objetivos */}
      {data.objetivos && data.objetivos.length > 0 && (
        <ScrollReveal className="mx-auto mt-14 max-w-2xl">
          <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
            Objetivos
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-emerald-dark/80 sm:text-base">
            {data.objetivos.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-dourado-health" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}

      {/* Informações importantes */}
      {data.informacoesAdicionais && (
        <ScrollReveal className="mx-auto mt-14 max-w-2xl">
          <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
            Informações importantes
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-dark/80 sm:text-base">
            {data.informacoesAdicionais}
          </p>
        </ScrollReveal>
      )}

      {/* Atenção — destaque âmbar sutil, por ser informação de segurança */}
      {data.atencao && (
        <ScrollReveal className="mx-auto mt-14 max-w-2xl">
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-5 sm:p-6">
            <h2 className="font-flatline text-lg text-amber-900 sm:text-xl">
              Atenção
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-amber-800">
              {data.atencao}
            </p>
          </div>
        </ScrollReveal>
      )}

      {/* Possíveis intercorrências */}
      {data.intercorrencias && data.intercorrencias.length > 0 && (
        <ScrollReveal className="mx-auto mt-14 max-w-2xl">
          <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
            Possíveis intercorrências
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-emerald-dark/80 sm:text-base">
            {data.intercorrencias.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-dourado-health" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}

      {/* CTA de agendamento */}
      <div className="mt-14 flex flex-col items-center gap-3">
        <span className="text-sm text-emerald-dark/60">Sob consulta</span>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Agendar pelo WhatsApp
        </a>
      </div>
    </motion.article>
  )
}

export default ServicoPage
