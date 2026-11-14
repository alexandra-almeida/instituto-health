import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { podeVerCadastros } from '../../lib/admin'

// Guarda das páginas de admin. É só a parte de interface da proteção: quem
// protege de verdade é o backend, que recusa (403) toda rota /api/admin para
// quem não é admin, mesmo que a pessoa chegue aqui por outro caminho.
//
// - Sessão ainda sendo conferida: não mostra nada (evita piscar "sem permissão")
// - Deslogado: leva ao login e volta para cá depois
// - Logado sem ser admin: "sem permissão"
function RotaDeAdmin({ children }: { children: ReactNode }) {
  const { status, perfil } = useAuth()
  const { pathname } = useLocation()

  if (status === 'carregando') {
    return (
      <p className="py-16 text-center text-sm text-verde-health/70">
        Carregando...
      </p>
    )
  }

  if (status === 'deslogado') {
    return <Navigate to={`/login?destino=${pathname}`} replace />
  }

  if (!podeVerCadastros(perfil)) {
    return (
      <section className="mx-auto w-full max-w-md py-16 text-center">
        <h1 className="font-flatline text-2xl text-verde-health">
          Sem permissão
        </h1>
        <p className="mt-3 text-sm text-verde-health/70">
          Você não tem permissão para ver esta página.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#04452E]/20 px-8 text-sm font-medium text-verde-health transition-colors hover:border-dourado-health/60 hover:text-dourado-health"
        >
          Voltar ao início
        </Link>
      </section>
    )
  }

  return <>{children}</>
}

export default RotaDeAdmin
