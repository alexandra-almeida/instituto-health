import type { ReactNode } from 'react'
import type { ProdutoDetalhes } from '../../data/tulipiaDetalhes'
import { ChevronRightIcon } from '../icons'

interface SectionProps {
  title: string
  /** abre já expandida (as demais começam recolhidas) */
  defaultOpen?: boolean
  children: ReactNode
}

// Seção recolhível nativa (<details>): funciona sem JS, com teclado e leitor
// de tela, e em telas pequenas evita uma página enorme de texto corrido.
function Section({ title, defaultOpen = false, children }: SectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-[#04452E]/10 py-4"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h2 className="font-flatline text-lg text-[#04452E]">{title}</h2>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#04452E] transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-[#04452E]/80">
        {children}
      </div>
    </details>
  )
}

interface ProductDetailsProps {
  detalhes: ProdutoDetalhes
}

// Seções de detalhe do produto (benefícios, ativos, indicações, modo de
// uso, INCI). Cada uma só aparece quando o campo existe em
// tulipiaDetalhes.ts. A descrição fica na coluna ao lado da galeria.
function ProductDetails({ detalhes }: ProductDetailsProps) {
  const { beneficios, principiosAtivos, indicacoes, modoDeUso, avisos, inci } =
    detalhes
  const temModoDeUso = Boolean(modoDeUso?.length || avisos?.length)

  return (
    <div className="mt-12 border-t border-[#04452E]/10">
      {beneficios && beneficios.length > 0 && (
        <Section title="Benefícios">
          <ul className="space-y-3">
            {beneficios.map((b) => (
              <li key={b.titulo}>
                <p className="font-semibold text-[#04452E]">{b.titulo}</p>
                {b.texto && <p className="mt-0.5">{b.texto}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {principiosAtivos && principiosAtivos.length > 0 && (
        <Section title="Princípios ativos">
          <div className="space-y-3">
            {principiosAtivos.map((ativo, index) => {
              const novoGrupo =
                ativo.grupo &&
                ativo.grupo !== principiosAtivos[index - 1]?.grupo
              return (
                <div key={`${ativo.grupo ?? ''}${ativo.nome}`}>
                  {novoGrupo && (
                    <p className="mt-2 mb-2 text-xs font-semibold tracking-wide text-dourado-health uppercase">
                      {ativo.grupo}
                    </p>
                  )}
                  <p className="font-semibold text-[#04452E]">{ativo.nome}</p>
                  <p className="mt-0.5">{ativo.descricao}</p>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {indicacoes && indicacoes.length > 0 && (
        <Section title="Indicações">
          <ul className="flex flex-wrap gap-2">
            {indicacoes.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[#04452E]/15 bg-white px-3 py-1 text-xs text-[#04452E]"
              >
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {temModoDeUso && (
        <Section title="Modo de usar" defaultOpen>
          {modoDeUso && modoDeUso.length > 0 && (
            <ul className="space-y-2">
              {modoDeUso.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ul>
          )}
          {/* Avisos em destaque e na íntegra: segurança de uso não pode
              ficar escondida nem resumida. */}
          {avisos && avisos.length > 0 && (
            <div
              role="note"
              className="mt-4 space-y-2 rounded-2xl border border-[#CAA02D]/40 bg-[#CAA02D]/10 p-4 text-[#04452E]"
            >
              {avisos.map((aviso) => (
                <p key={aviso}>{aviso}</p>
              ))}
            </div>
          )}
        </Section>
      )}

      {inci && inci.length > 0 && (
        <Section title="Composição (INCI)">
          <div className="space-y-3 text-xs leading-relaxed">
            {inci.map((formula) => (
              <p key={formula.rotulo ?? 'inci'}>
                {formula.rotulo && (
                  <span className="font-semibold">{formula.rotulo}: </span>
                )}
                {formula.texto}
              </p>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

export default ProductDetails
