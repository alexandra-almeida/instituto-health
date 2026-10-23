import type { ReactNode } from 'react'

// Caixa de aviso dos formulários (Login, Cadastro, Redefinir senha). 'info'
// é o aviso neutro que o Login já usava; 'erro' é para respostas da API.
function AlertaDeFormulario({
  variante = 'info',
  children,
}: {
  variante?: 'info' | 'erro'
  children: ReactNode
}) {
  const cores =
    variante === 'erro'
      ? 'border-red-300/60 bg-red-50/70 text-red-700'
      : 'border-[#04452E]/10 bg-verde-health/5 text-verde-health'

  return (
    <div
      role={variante === 'erro' ? 'alert' : 'status'}
      className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-[0_2px_10px_-4px_rgba(4,32,18,0.06)] backdrop-blur-sm ${cores}`}
    >
      {children}
    </div>
  )
}

export default AlertaDeFormulario
