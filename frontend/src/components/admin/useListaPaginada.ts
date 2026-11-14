import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import type { PaginaDeCadastros } from '../../lib/api'
import { ESPERA_DA_BUSCA_EM_MS } from '../../lib/admin'

interface Opcoes<T> {
  buscar: (pagina: number, busca: string) => Promise<PaginaDeCadastros<T>>
  /** Quando muda (ex.: troca de aba), volta para a página 1 */
  chave: string
}

// Lista paginada com busca: a busca espera a pessoa parar de digitar, a página
// volta para 1 quando a busca ou a chave mudam, e uma resposta atrasada de uma
// consulta antiga nunca sobrescreve a mais nova.
export function useListaPaginada<T>({ buscar, chave }: Opcoes<T>) {
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState({ chave: '', numero: 1 })
  const [versao, setVersao] = useState(0)
  // `resposta` guarda o resultado da consulta feita (com o id dela); enquanto
  // o id da consulta atual não bate com o da resposta, está carregando. Assim
  // não é preciso mexer em estado no corpo do efeito. `ultimos` mantém a
  // última página boa na tela enquanto a próxima carrega.
  const [resposta, setResposta] = useState<{
    id: string
    erro: ApiError | null
  } | null>(null)
  const [ultimos, setUltimos] = useState<PaginaDeCadastros<T> | null>(null)

  // Chave de consulta = aba + busca: mudou, volta para a página 1
  const chaveDaConsulta = `${chave}|${busca}`
  const numeroDaPagina = pagina.chave === chaveDaConsulta ? pagina.numero : 1
  const idDaConsulta = `${chaveDaConsulta}|${numeroDaPagina}|${versao}`

  useEffect(() => {
    const espera = window.setTimeout(
      () => setBusca(texto.trim()),
      ESPERA_DA_BUSCA_EM_MS,
    )
    return () => window.clearTimeout(espera)
  }, [texto])

  useEffect(() => {
    let ativo = true
    buscar(numeroDaPagina, busca)
      .then((pagina) => {
        if (!ativo) return
        setUltimos(pagina)
        setResposta({ id: idDaConsulta, erro: null })
      })
      .catch((falha: unknown) => {
        if (!ativo) return
        setResposta({
          id: idDaConsulta,
          erro:
            falha instanceof ApiError
              ? falha
              : new ApiError(
                  'erro_servidor',
                  'Algo deu errado. Tente novamente em instantes.',
                  0,
                ),
        })
      })
    return () => {
      ativo = false
    }
    // `buscar` muda a cada render do chamador; quem manda é a chave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDaConsulta])

  const irParaPagina = useCallback(
    (numero: number) =>
      setPagina({ chave: chaveDaConsulta, numero: Math.max(1, numero) }),
    [chaveDaConsulta],
  )
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return {
    texto,
    setTexto,
    busca,
    pagina: numeroDaPagina,
    irParaPagina,
    dados: ultimos,
    carregando: resposta?.id !== idDaConsulta,
    erro: resposta?.id === idDaConsulta ? resposta.erro : null,
    recarregar,
  }
}
