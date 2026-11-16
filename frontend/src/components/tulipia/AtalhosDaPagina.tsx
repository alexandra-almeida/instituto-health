type Publico = 'homecare' | 'profissional'

interface AtalhosDaPaginaProps {
  /** modo atual; é o mesmo estado do seletor Profissional / Home Care */
  publico: Publico
  onPublico: (publico: Publico) => void
  onQueridinhos: () => void
  onLancamentos: () => void
  /** sem promoção no ar, não passe: o atalho "Ofertas" some junto */
  onOfertas?: () => void
  /** true com o filtro da promoção ligado (só para marcar o botão) */
  ofertasLigadas?: boolean
}

const BASE =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors'
const NORMAL =
  'border-[#04452E]/15 bg-white text-[#04452E] hover:border-[#CAA02D] hover:text-[#CAA02D]'
const ATIVO = 'border-[#CAA02D] bg-[#CAA02D] text-[#04452E]'

// Linha de atalhos no topo da /tulipia, como no menu da Tulípia. Profissional
// e Home Care trocam o modo (o seletor que já existe mais abaixo mostra o
// mesmo estado); Queridinhos e Lançamentos rolam até a seção; Ofertas aplica o
// filtro da promoção. No celular a linha rola na horizontal (nada quebra em
// duas linhas) e os botões têm 40px de altura. O `w-max` com `mx-auto` centra
// a linha quando cabe e deixa rolar, a partir do primeiro botão, quando não
// cabe.
function AtalhosDaPagina({
  publico,
  onPublico,
  onQueridinhos,
  onLancamentos,
  onOfertas,
  ofertasLigadas = false,
}: AtalhosDaPaginaProps) {
  return (
    <nav
      aria-label="Atalhos da página"
      className="no-scrollbar mt-6 overflow-x-auto"
    >
      <div className="mx-auto flex w-max gap-2 px-1 py-1">
        <button
          type="button"
          onClick={() => onPublico('profissional')}
          aria-pressed={publico === 'profissional'}
          className={`${BASE} ${publico === 'profissional' ? ATIVO : NORMAL}`}
        >
          Profissional
        </button>
        <button
          type="button"
          onClick={() => onPublico('homecare')}
          aria-pressed={publico === 'homecare'}
          className={`${BASE} ${publico === 'homecare' ? ATIVO : NORMAL}`}
        >
          Home Care
        </button>
        <button
          type="button"
          onClick={onQueridinhos}
          className={`${BASE} ${NORMAL}`}
        >
          Queridinhos
        </button>
        <button
          type="button"
          onClick={onLancamentos}
          className={`${BASE} ${NORMAL}`}
        >
          Lançamentos
        </button>
        {onOfertas && (
          <button
            type="button"
            onClick={onOfertas}
            aria-pressed={ofertasLigadas}
            className={`${BASE} ${ofertasLigadas ? ATIVO : NORMAL}`}
          >
            Ofertas
          </button>
        )}
      </div>
    </nav>
  )
}

export default AtalhosDaPagina
