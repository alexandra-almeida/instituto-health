import { faixaDaPagina } from '../../lib/admin'

const CAIXA_DE_BOTAO =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-[#04452E]/20 px-5 text-sm font-medium text-verde-health transition-colors hover:border-dourado-health/60 hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-40'

export function CampoDeBusca({
  valor,
  onChange,
  rotulo,
}: {
  valor: string
  onChange: (texto: string) => void
  rotulo: string
}) {
  return (
    <label className="block">
      <span className="sr-only">{rotulo}</span>
      <input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        maxLength={100}
        placeholder="Buscar por nome ou e-mail"
        autoComplete="off"
        className="min-h-11 w-full rounded-full border border-[#04452E]/15 bg-white/70 px-5 text-base text-verde-health placeholder:text-verde-health/40 focus:border-dourado-health focus:outline-none"
      />
    </label>
  )
}

export function Paginacao({
  pagina,
  totalDePaginas,
  porPagina,
  total,
  carregando,
  onMudar,
}: {
  pagina: number
  totalDePaginas: number
  porPagina: number
  total: number
  carregando: boolean
  onMudar: (pagina: number) => void
}) {
  return (
    <nav aria-label="Páginas" className="mt-5 flex flex-col gap-3">
      <p
        className="text-center text-sm text-verde-health/70"
        aria-live="polite"
      >
        {faixaDaPagina(pagina, porPagina, total)}
      </p>
      {totalDePaginas > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onMudar(pagina - 1)}
            disabled={pagina <= 1 || carregando}
            className={CAIXA_DE_BOTAO}
          >
            Anterior
          </button>
          <span className="text-sm text-verde-health/70">
            Página {pagina} de {totalDePaginas}
          </span>
          <button
            type="button"
            onClick={() => onMudar(pagina + 1)}
            disabled={pagina >= totalDePaginas || carregando}
            className={CAIXA_DE_BOTAO}
          >
            Próxima
          </button>
        </div>
      )}
    </nav>
  )
}
