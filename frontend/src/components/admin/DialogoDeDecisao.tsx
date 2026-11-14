import { useEffect, useId, useRef, useState } from 'react'
import { ApiError, api } from '../../lib/api'
import type { ProfissionalNaLista } from '../../lib/api'
import { MOTIVO_MAXIMO, motivoDaRecusa } from '../../lib/admin'

export type AcaoDeDecisao = 'aprovar' | 'recusar'

interface DialogoDeDecisaoProps {
  profissional: Pick<ProfissionalNaLista, 'id' | 'nome'>
  acao: AcaoDeDecisao
  /** `atualizar`: a lista precisa ser recarregada (a decisão valeu, ou o
   * cadastro já tinha sido decidido por outra pessoa) */
  onFechar: (atualizar: boolean) => void
  onConcluido: (acao: AcaoDeDecisao) => void
}

// Confirmação antes de aprovar ou recusar. Recusar exige um motivo curto, que
// vai por e-mail para o profissional e fica no histórico. Enquanto envia, não
// fecha (para não decidir duas vezes nem perder o resultado).
function DialogoDeDecisao({
  profissional,
  acao,
  onFechar,
  onConcluido,
}: DialogoDeDecisaoProps) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<ApiError | null>(null)
  const painel = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const botaoPrincipal = useRef<HTMLButtonElement>(null)
  const idDoTitulo = useId()
  const idDoErro = useId()

  const recusando = acao === 'recusar'
  const { valido, limpo } = motivoDaRecusa(motivo)
  const podeConfirmar = !enviando && (!recusando || valido)
  // Já decidido por outra pessoa: só resta fechar e atualizar a lista
  const jaDecidido = erro?.status === 409

  useEffect(() => {
    // Foco no primeiro campo; sem rolagem da página por trás
    ;(recusando ? campo.current : botaoPrincipal.current)?.focus()
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [recusando])

  function fechar(atualizar: boolean) {
    if (!enviando) onFechar(atualizar)
  }

  async function confirmar() {
    if (!podeConfirmar) return
    setEnviando(true)
    setErro(null)
    try {
      if (recusando) await api.admin.recusar(profissional.id, limpo)
      else await api.admin.aprovar(profissional.id)
      onConcluido(acao)
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha
          : new ApiError(
              'erro_servidor',
              'Algo deu errado. Tente novamente em instantes.',
              0,
            ),
      )
      setEnviando(false)
    }
  }

  // Esc fecha; Tab fica dentro do painel
  function aoTeclar(evento: React.KeyboardEvent) {
    if (evento.key === 'Escape') {
      fechar(jaDecidido)
      return
    }
    if (evento.key !== 'Tab' || !painel.current) return
    const focaveis = painel.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), textarea:not(:disabled)',
    )
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (!primeiro || !ultimo) return
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onKeyDown={aoTeclar}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar(jaDecidido)
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-offwhite p-5 shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <h2 id={idDoTitulo} className="font-flatline text-xl text-verde-health">
          {recusando ? 'Recusar cadastro?' : 'Aprovar cadastro?'}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-verde-health/80">
          {recusando ? (
            <>
              Informe o motivo. Ele será enviado por e-mail para{' '}
              <strong className="font-medium">{profissional.nome}</strong>, que
              poderá enviar um novo comprovante.
            </>
          ) : (
            <>
              Aprovar o cadastro profissional de{' '}
              <strong className="font-medium">{profissional.nome}</strong>? A
              pessoa será avisada por e-mail.
            </>
          )}
        </p>

        {recusando && (
          <div className="mt-4">
            <label
              htmlFor={`${idDoTitulo}-motivo`}
              className="text-sm font-medium text-verde-health"
            >
              Motivo da recusa
            </label>
            <textarea
              id={`${idDoTitulo}-motivo`}
              ref={campo}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={MOTIVO_MAXIMO}
              rows={4}
              disabled={enviando || jaDecidido}
              aria-describedby={erro ? idDoErro : undefined}
              className="mt-1.5 w-full resize-none rounded-2xl border border-[#04452E]/15 bg-white px-4 py-3 text-base text-verde-health focus:border-dourado-health focus:outline-none disabled:opacity-60"
            />
            <p className="mt-1 text-right text-xs text-verde-health/55">
              {motivo.length}/{MOTIVO_MAXIMO}
            </p>
          </div>
        )}

        {erro && (
          <p
            id={idDoErro}
            role="alert"
            className="mt-4 rounded-2xl border border-red-300/60 bg-red-50/70 px-4 py-3 text-sm text-red-700"
          >
            {erro.message}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => fechar(jaDecidido)}
            disabled={enviando}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#04452E]/20 px-6 text-sm font-medium text-verde-health transition-colors hover:border-dourado-health/60 disabled:opacity-50"
          >
            {jaDecidido ? 'Fechar' : 'Cancelar'}
          </button>
          {!jaDecidido && (
            <button
              ref={botaoPrincipal}
              type="button"
              onClick={confirmar}
              disabled={!podeConfirmar}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                recusando
                  ? 'bg-red-700 text-white hover:bg-red-800'
                  : 'bg-verde-health text-offwhite hover:bg-verde-health/90'
              }`}
            >
              {enviando ? 'Enviando...' : recusando ? 'Recusar' : 'Aprovar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DialogoDeDecisao
