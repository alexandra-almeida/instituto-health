import { Link } from 'react-router-dom'
import type { TulipiaProduct } from '../../data/tulipiaProducts'
import { formatPrice, generateDescription } from '../../data/tulipiaProducts'
import ScrollReveal from '../ScrollReveal'

interface QueridinhosDestaqueProps {
  produtos: TulipiaProduct[]
}

// Destaque editorial dos Queridinhos, no topo da página (antes do grid
// padrão) — foto grande de um lado, texto completo do outro, no estilo do
// site oficial da Tulípia. Só os 2-3 primeiros, não o grid inteiro.
function QueridinhosDestaque({ produtos }: QueridinhosDestaqueProps) {
  if (produtos.length === 0) return null

  return (
    <div className="mt-12">
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h2 className="font-flatline text-xl leading-tight text-[#04452E] sm:text-2xl">
          Queridinhos
        </h2>
        <p className="text-sm text-[#04452E]/70">
          Os favoritos da clientela Tulípia
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-5">
        {produtos.map((produto, index) => (
          <ScrollReveal key={produto.id} delay={index * 0.08}>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] sm:flex-row lg:flex-col">
              <Link
                to={`/tulipia/produto/${produto.id}`}
                className="block aspect-square shrink-0 overflow-hidden bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15 sm:h-auto sm:w-2/5 lg:w-full"
              >
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-medium text-[#04452E]/45 uppercase">
                    {produto.displayName}
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8 lg:p-6">
                {produto.linha && (
                  <span className="text-xs font-semibold tracking-wide text-dourado-health uppercase">
                    {produto.linha}
                  </span>
                )}
                <h3 className="font-inter text-xl leading-snug font-normal text-verde-health sm:text-2xl lg:text-lg">
                  {produto.displayName}
                </h3>
                <p className="font-inter max-w-md text-sm leading-relaxed text-[#04452E]/70 lg:line-clamp-3">
                  {generateDescription(produto)}
                </p>
                {produto.exclusivoProfissional ? (
                  <span className="w-fit rounded-full bg-dourado-health/15 px-4 py-1.5 text-sm font-semibold text-dourado-health">
                    Exclusivo para profissionais
                  </span>
                ) : (
                  <p className="font-inter text-2xl font-semibold text-verde-health">
                    {formatPrice(produto.preco)}
                  </p>
                )}
                <Link
                  to={`/tulipia/produto/${produto.id}`}
                  className="mt-1 inline-flex w-fit items-center justify-center rounded-[10px] bg-dourado-health px-6 py-2.5 text-sm font-medium text-verde-profundo transition-colors hover:bg-dourado-claro"
                >
                  Ver produto
                </Link>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}

export default QueridinhosDestaque
