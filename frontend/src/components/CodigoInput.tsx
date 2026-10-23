import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { CODIGO_TAMANHO, codigoVazio } from '../lib/codigo'

// 6 caixinhas de 1 dígito cada, com avanço automático de foco, volta com
// Backspace e colagem do código inteiro. Usado na confirmação de e-mail do
// Cadastro e na página de redefinir senha. O estado fica com quem usa.
function CodigoInput({
  digitos,
  onChange,
  disabled,
}: {
  digitos: string[]
  onChange: (digitos: string[]) => void
  disabled?: boolean
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(index: number, value: string) {
    const digito = value.replace(/\D/g, '').slice(-1)
    const proximo = [...digitos]
    proximo[index] = digito
    onChange(proximo)
    if (digito && index < CODIGO_TAMANHO - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Backspace' && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const colado = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODIGO_TAMANHO)
    if (!colado) return
    event.preventDefault()
    const proximo = codigoVazio()
    for (let i = 0; i < colado.length; i++) proximo[i] = colado[i] ?? ''
    onChange(proximo)
    inputsRef.current[Math.min(colado.length, CODIGO_TAMANHO) - 1]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 xs:gap-3">
      {digitos.map((digito, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digito}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`Dígito ${index + 1} do código`}
          className="h-12 w-10 rounded-xl border border-[#04452E]/12 bg-white/60 text-center text-lg font-semibold text-verde-health shadow-[0_2px_8px_-4px_rgba(4,32,18,0.08)] focus:border-dourado-health/60 focus:ring-2 focus:ring-dourado-health/15 focus:outline-none disabled:opacity-60 xs:h-14 xs:w-12"
        />
      ))}
    </div>
  )
}

export default CodigoInput
