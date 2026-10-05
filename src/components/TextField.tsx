// Campo de texto padrão de formulário (rótulo, texto de ajuda/erro embaixo)
// — usado em Cadastro e Login. `PasswordField` reaproveita o mesmo
// `FieldProps`, só acrescenta o botão de mostrar/ocultar.
export interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  helper?: string
  error?: string
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  helper,
  error,
}: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helper ? `${id}-hint` : undefined}
        className="w-full rounded-xl border border-[#04452E]/12 bg-white/60 px-4 py-2.5 text-sm text-verde-health placeholder:text-verde-health/35 focus:border-dourado-health/60 focus:ring-2 focus:ring-dourado-health/15 focus:outline-none"
      />
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

export default TextField
