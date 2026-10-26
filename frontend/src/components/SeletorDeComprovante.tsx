import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { FileIcon, UploadIcon } from './icons'

// Mesmos tipos que o backend aceita (JPEG, PNG e PDF). Sem HEIC: com o campo
// listando só esses tipos, o iPhone converte a foto para JPEG ao escolher.
const COMPROVANTE_ACCEPT =
  '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'

function Numero({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-health text-xs text-offwhite">
      {n}
    </span>
  )
}

// Os dois blocos do comprovante: escolher o arquivo e declarar que ele é
// verídico. Usado no Cadastro e em Minha Conta. O arquivo e a declaração ficam
// com quem usa (só em memória, nunca em localStorage ou sessionStorage).
function SeletorDeComprovante({
  arquivo,
  onArquivoChange,
  confirmado,
  onConfirmadoChange,
  disabled,
}: {
  arquivo: File | null
  onArquivoChange: (arquivo: File | null) => void
  confirmado: boolean
  onConfirmadoChange: (confirmado: boolean) => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onArquivoChange(event.target.files?.[0] ?? null)
  }

  function handleRemoverArquivo() {
    onArquivoChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="mt-6">
        <h2 className="font-flatline flex items-center gap-2 text-base text-verde-health">
          <Numero n={1} />
          Selecione seu comprovante
        </h2>
        <p className="mt-2 ml-8 text-sm text-verde-health/70">
          Certificados de cursos da área de estética com somatória mínima de
          100h/aula.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={COMPROVANTE_ACCEPT}
          onChange={handleFileChange}
          disabled={disabled}
          aria-label="Arquivo do comprovante"
          className="sr-only"
        />

        {arquivo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#04452E]/10 bg-white/70 px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] backdrop-blur-sm">
            <span className="flex min-w-0 items-center gap-2.5 text-sm text-verde-health">
              <FileIcon className="h-5 w-5 shrink-0 text-dourado-health" />
              <span className="truncate">{arquivo.name}</span>
            </span>
            <button
              type="button"
              onClick={handleRemoverArquivo}
              disabled={disabled}
              className="shrink-0 text-xs font-medium text-verde-health/60 hover:text-dourado-health"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="mt-3 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-[#04452E]/15 bg-white/40 px-6 py-8 text-center backdrop-blur-sm transition-all hover:border-dourado-health/60 hover:bg-dourado-health/5"
          >
            <UploadIcon className="h-7 w-7 text-verde-health/50" />
            <span className="text-sm font-medium text-verde-health">
              Clique para selecionar o arquivo
            </span>
            <span className="text-xs text-verde-health/55">
              JPG, PNG ou PDF
            </span>
          </button>
        )}
      </div>

      <div className="mt-6">
        <h2 className="font-flatline flex items-center gap-2 text-base text-verde-health">
          <Numero n={2} />
          Confirme a veracidade
        </h2>

        <label className="mt-3 ml-8 flex items-start gap-2.5 text-sm text-verde-health/80">
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(event) => onConfirmadoChange(event.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 shrink-0 accent-dourado-health"
          />
          <span>
            Afirmo para todos os efeitos e sob pena da lei, que o documento
            enviado pertence a mim e é verídico.
          </span>
        </label>

        <div className="mt-3 ml-8 rounded-xl border border-amber-300/50 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800 backdrop-blur-sm">
          <strong className="font-semibold">Atenção:</strong> Seu comprovante
          será revisado na primeira compra. Caso não esteja de acordo com nosso
          termo de uso, a compra poderá ser cancelada.
        </div>
      </div>
    </>
  )
}

export default SeletorDeComprovante
