import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'
import type { FieldProps } from './TextField'

// Mesmo visual do TextField, com botão de mostrar/ocultar a senha.
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  helper,
  error,
}: FieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <span className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helper ? `${id}-hint` : undefined}
          className="w-full rounded-xl border border-[#04452E]/12 bg-white/60 px-4 py-2.5 pr-11 text-sm text-verde-health placeholder:text-verde-health/35 focus:border-dourado-health/60 focus:ring-2 focus:ring-dourado-health/15 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 text-verde-health/50 hover:text-dourado-health"
        >
          {visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </span>
      {error ? (
        <span id={`${id}-hint`} className="text-xs text-red-600">
          {error}
        </span>
      ) : helper ? (
        <span id={`${id}-hint`} className="text-xs text-verde-health/55">
          {helper}
        </span>
      ) : null}
    </label>
  )
}

export default PasswordField
