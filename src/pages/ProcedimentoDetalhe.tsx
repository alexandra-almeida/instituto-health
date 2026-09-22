import { Link, useParams } from 'react-router-dom'
import ServicoPage from '../components/ServicoPage'
import { findProcedimentoBySlug } from '../data/procedimentosDetalhe'

// Rota dinâmica /procedimentos/:slug — busca o conteúdo do procedimento
// pelo slug e renderiza o template compartilhado <ServicoPage>. Conteúdo
// ainda é de exemplo (ver data/procedimentosDetalhe.ts) até a Juliana
// revisar o texto definitivo de cada procedimento.
function ProcedimentoDetalhe() {
  const { slug } = useParams<{ slug: string }>()
  const procedimento = findProcedimentoBySlug(slug)

  if (!procedimento) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-20 text-center">
        <h1 className="font-flatline text-2xl text-emerald-dark">
          Procedimento não encontrado
        </h1>
        <p className="text-sm text-emerald-dark/70">
          O procedimento que você procura não existe ou foi removido.
        </p>
        <Link
          to="/procedimentos"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-6 py-2.5 text-sm text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver todos os procedimentos
        </Link>
      </div>
    )
  }

  return (
    <ServicoPage
      data={procedimento}
      parentLabel="Procedimentos"
      parentPath="/procedimentos"
    />
  )
}

export default ProcedimentoDetalhe
