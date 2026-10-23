import { useEffect, useState } from 'react'
import { RESEND_COOLDOWN_SECONDS } from '../lib/codigo'

// Botão de reenviar código com a contagem regressiva do Supabase (60 s).
// `onReenviar` devolve true quando o envio foi pedido; só então a contagem
// recomeça. Quem usa mostra os erros, este botão só cuida do tempo.
function ReenviarCodigo({
  onReenviar,
  segundosIniciais = RESEND_COOLDOWN_SECONDS,
}: {
  onReenviar: () => Promise<boolean>
  segundosIniciais?: number
}) {
  const [segundos, setSegundos] = useState(segundosIniciais)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (segundos <= 0) return
    const timer = window.setInterval(() => {
      setSegundos((atual) => Math.max(0, atual - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [segundos])

  async function handleClick() {
    if (segundos > 0 || enviando) return
    setEnviando(true)
    const enviado = await onReenviar()
    setEnviando(false)
    if (enviado) setSegundos(RESEND_COOLDOWN_SECONDS)
  }

  const bloqueado = segundos > 0 || enviando
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={bloqueado}
      className={`text-sm font-medium ${
        bloqueado
          ? 'cursor-not-allowed text-verde-health/40'
          : 'text-dourado-health hover:underline'
      }`}
    >
      {enviando
        ? 'Enviando...'
        : segundos > 0
          ? `Reenviar código em ${segundos}s`
          : 'Reenviar código'}
    </button>
  )
}

export default ReenviarCodigo
