import type { ReactNode } from 'react'

// Botão principal — usado em qualquer fluxo de formulário do site (Cadastro,
// Login, Checkout...). Sólido com sombra suave quando habilitado (ainda
// precisa de contraste pra ação principal ficar clara); desabilitado é
// quase invisível (tom da marca em opacidade bem baixa), em vez de um
// cinza pesado.
function PrimaryButton({
  type = 'button',
  disabled,
  onClick,
  className = '',
  children,
}: {
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`font-flatline w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-all ${
        disabled
          ? 'cursor-not-allowed bg-verde-health/8 text-verde-health/25'
          : 'bg-verde-health text-offwhite shadow-[0_6px_20px_-6px_rgba(4,69,46,0.5)] hover:bg-verde-health/90 hover:shadow-[0_8px_24px_-6px_rgba(4,69,46,0.55)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
