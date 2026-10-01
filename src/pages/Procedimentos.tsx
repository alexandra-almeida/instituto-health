import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FadedImage from '../components/FadedImage'
import ScrollReveal from '../components/ScrollReveal'
import {
  CATEGORIA_IMAGEM,
  CATEGORIAS,
  PROCEDIMENTOS,
} from '../data/procedimentos'
import type { Procedimento, ProcedimentoCategoria } from '../data/procedimentos'

type FiltroCategoria = ProcedimentoCategoria | 'Todos'

const FILTROS: FiltroCategoria[] = ['Todos', ...CATEGORIAS]

function ProcedimentoCard({ procedimento }: { procedimento: Procedimento }) {
  return (
    <Link
      to={`/procedimentos/${procedimento.slug}`}
      className="flex h-full flex-col items-center gap-3 rounded-2xl border border-emerald-dark/10 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <FadedImage
          src={CATEGORIA_IMAGEM[procedimento.categoria]}
          alt=""
          className="h-full w-full rounded-full"
        />
      </div>
      <span className="text-[11px] font-semibold tracking-wide text-dourado-health uppercase">
        {procedimento.categoria}
      </span>
      <h2 className="font-flatline text-lg leading-tight text-emerald-dark">
        {procedimento.nome}
      </h2>
      <p className="line-clamp-2 text-sm text-emerald-dark/70">
        {procedimento.descricao}
      </p>
      <span className="font-flatline text-sm text-emerald-dark">
        Sob consulta
      </span>
      <span className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-dark px-6 py-2 text-xs font-medium text-offwhite transition-colors hover:bg-emerald-dark/90">
        Saiba mais
      </span>
    </Link>
  )
}

// Listagem de procedimentos — filtro por categoria em pills (mesmo padrão
// de segmented control já usado em outras páginas do site) + grid de
// cards. Nenhuma foto real existe ainda por procedimento, então cada card
// usa a foto genérica da categoria (ver CATEGORIA_IMAGEM).
function Procedimentos() {
  const [filtro, setFiltro] = useState<FiltroCategoria>('Todos')

  const procedimentosFiltrados =
    filtro === 'Todos'
      ? PROCEDIMENTOS
      : PROCEDIMENTOS.filter((item) => item.categoria === filtro)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
          Procedimentos
        </h1>
        <p className="max-w-xl text-sm text-emerald-dark/70 sm:text-base">
          Atendimentos presenciais no Instituto Health, com avaliação
          individual e acompanhamento próximo em cada etapa.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {FILTROS.map((categoria) => {
          const selecionado = filtro === categoria
          return (
            <button
              key={categoria}
              type="button"
              onClick={() => setFiltro(categoria)}
              aria-pressed={selecionado}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selecionado
                  ? 'border-dourado-health bg-dourado-health text-emerald-dark'
                  : 'border-emerald-dark/15 text-emerald-dark hover:border-dourado-health/50'
              }`}
            >
              {categoria}
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 xs:grid-cols-2 lg:grid-cols-3">
        {procedimentosFiltrados.map((procedimento, index) => (
          <ScrollReveal key={procedimento.slug} delay={(index % 6) * 0.06}>
            <ProcedimentoCard procedimento={procedimento} />
          </ScrollReveal>
        ))}
      </div>
    </motion.section>
  )
}

export default Procedimentos
