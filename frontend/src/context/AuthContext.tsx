import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import type { DadosDaSessao } from '../lib/api'
import { AuthContext } from './auth-context'
import type { AuthContextValue, StatusDaSessao } from './auth-context'

// A sessão fica nos cookies httpOnly do backend. Aqui só mora o resultado de
// perguntar "quem sou eu?" ao servidor: nada de token, e nada vai para
// localStorage ou sessionStorage.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusDaSessao>('carregando')
  const [dados, setDados] = useState<DadosDaSessao | null>(null)

  useEffect(() => {
    // `ativo` evita aplicar a resposta se o componente já saiu de cena
    // (o React em desenvolvimento monta o efeito duas vezes)
    let ativo = true
    api
      .eu()
      .then((sessao) => {
        if (!ativo) return
        setDados(sessao)
        setStatus('logado')
      })
      .catch(() => {
        // 401 é o caso normal de quem não entrou; qualquer outra falha também
        // deixa o site utilizável como visitante
        if (!ativo) return
        setDados(null)
        setStatus('deslogado')
      })
    return () => {
      ativo = false
    }
  }, [])

  const abrirSessao = useCallback((sessao: DadosDaSessao) => {
    setDados(sessao)
    setStatus('logado')
    return sessao
  }, [])

  const entrar = useCallback(
    async (email: string, senha: string) =>
      abrirSessao(await api.login(email, senha)),
    [abrirSessao],
  )

  const confirmarEmail = useCallback(
    async (email: string, codigo: string) =>
      abrirSessao(await api.confirmarEmail(email, codigo)),
    [abrirSessao],
  )

  const sair = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      // O backend limpa os cookies e responde 204 mesmo sem sessão; se a
      // chamada falhar por rede, a pessoa também sai da tela
      setDados(null)
      setStatus('deslogado')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      usuario: dados?.usuario ?? null,
      perfil: dados?.perfil ?? null,
      entrar,
      confirmarEmail,
      sair,
    }),
    [status, dados, entrar, confirmarEmail, sair],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
