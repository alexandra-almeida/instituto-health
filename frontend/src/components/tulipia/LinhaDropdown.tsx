import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface LinhaDropdownProps {
  linhas: string[]
  selected: string
  onSelect: (linha: string) => void
}

// Menu suspenso único pra escolher a linha — substitui a parede de 30+
// pills. Lista em colunas dentro do painel + busca interna, já que são
// muitas opções pra rolar visualmente de uma vez.
function LinhaDropdown({ linhas, selected, onSelect }: LinhaDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const filteredLinhas = linhas.filter((linha) =>
    linha.toLowerCase().includes(query.trim().toLowerCase()),
  )

  function handleSelect(linha: string) {
    onSelect(linha)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative mx-auto mt-5 w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-[#04452E]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#04452E] transition-colors hover:border-dourado-health"
      >
        <span className="truncate">
          {selected ? selected : 'Selecionar linha'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#04452E]/60 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-2 w-full min-w-70 rounded-2xl border border-[#04452E]/10 bg-white p-3 shadow-lg xs:min-w-85">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar linha..."
            autoFocus
            className="w-full rounded-full border border-[#04452E]/15 px-3.5 py-2 text-sm text-[#04452E] placeholder:text-[#04452E]/40 focus:border-dourado-health focus:outline-none"
          />
          <div className="mt-3 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
            {filteredLinhas.map((linha) => (
              <button
                key={linha}
                type="button"
                onClick={() => handleSelect(linha)}
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs leading-tight transition-colors ${
                  linha === selected
                    ? 'bg-dourado-health/15 text-dourado-health'
                    : 'text-[#04452E]/75 hover:bg-[#04452E]/5'
                }`}
              >
                {linha}
              </button>
            ))}
            {filteredLinhas.length === 0 && (
              <p className="col-span-full py-3 text-center text-xs text-[#04452E]/50">
                Nenhuma linha encontrada.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LinhaDropdown
