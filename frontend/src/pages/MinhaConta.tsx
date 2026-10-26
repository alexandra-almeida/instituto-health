import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AlertaDeFormulario from '../components/AlertaDeFormulario'
import PrimaryButton from '../components/PrimaryButton'
import SeletorDeComprovante from '../components/SeletorDeComprovante'
import { useAuth } from '../context/useAuth'
import { WHATSAPP_NUMBER } from '../data/contact'
import { ApiError, api } from '../lib/api'
import type { ComprovanteEnviado } from '../lib/api'
import {
  podeEnviarComprovante,
  resumoDosEnviados,
  rotuloDoPerfil,
} from '../lib/conta'

function comoApiError(falha: unknown): ApiError {
  return falha instanceof ApiError
    ? falha
    : new ApiError(
        'erro_servidor',
        'Algo deu errado. Tente novamente em instantes.',
        0,
      )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-verde-health/55 uppercase sm:w-24 sm:shrink-0 sm:pt-0.5">
        {rotulo}
      </dt>
      <dd className="min-w-0 text-sm break-words text-verde-health">{valor}</dd>
    </div>
  )
}

type Envio = 'ocioso' | 'enviando' | 'enviado' | 'erro'

// Comprovante do profissional: mostra o que já foi enviado e oferece enviar
// (ou reenviar). O envio é o mesmo do Cadastro (api.enviarComprovante): o
// arquivo vai direto para uma URL assinada e fica só em memória no navegador.
function SecaoDoComprovante({ recusado }: { recusado: boolean }) {
  const [enviados, setEnviados] = useState<ComprovanteEnviado[] | null>(null)
  const [erroDaLista, setErroDaLista] = useState<ApiError | null>(null)
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [confirmado, setConfirmado] = useState(false)
  const [envio, setEnvio] = useState<Envio>('ocioso')
  const [erroDoEnvio, setErroDoEnvio] = useState<ApiError | null>(null)

  useEffect(() => {
    // `ativo` evita aplicar a resposta se a pessoa já saiu da página
    let ativo = true
    api
      .listarComprovantes()
      .then(({ comprovantes }) => {
        if (ativo) setEnviados(comprovantes)
      })
      .catch((falha: unknown) => {
        if (ativo) setErroDaLista(comoApiError(falha))
      })
    return () => {
      ativo = false
    }
  }, [])

  function recarregarLista() {
    setErroDaLista(null)
    setEnviados(null)
    api
      .listarComprovantes()
      .then(({ comprovantes }) => setEnviados(comprovantes))
      .catch((falha: unknown) => setErroDaLista(comoApiError(falha)))
  }

  async function handleEnviar() {
    if (!arquivo || !confirmado || envio === 'enviando') return

    setEnvio('enviando')
    setErroDoEnvio(null)
    try {
      await api.enviarComprovante(arquivo)
      setArquivo(null)
      setConfirmado(false)
      setSeletorAberto(false)
      setEnvio('enviado')
      recarregarLista()
    } catch (falha) {
      // O arquivo continua em memória para "Tentar enviar de novo"
      setErroDoEnvio(comoApiError(falha))
      setEnvio('erro')
    }
  }

  const carregando = enviados === null && erroDaLista === null
  const resumo = enviados ? resumoDosEnviados(enviados) : null
  const faltando = enviados !== null && enviados.length === 0
  // Sem nenhum comprovante o seletor já vem aberto; com algum, só pelo botão
  const mostrarSeletor = faltando || seletorAberto

  return (
    <section className="mt-8">
      <h2 className="font-flatline text-lg text-verde-health">
        Comprovante profissional
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {carregando && (
          <p className="text-sm text-verde-health/70">
            Carregando comprovantes...
          </p>
        )}

        {erroDaLista && (
          <AlertaDeFormulario variante="erro">
            <p>{erroDaLista.message}</p>
            <button
              type="button"
              onClick={recarregarLista}
              className="mt-2 font-medium text-dourado-health hover:underline"
            >
              Tentar de novo
            </button>
          </AlertaDeFormulario>
        )}

        {faltando && (
          <AlertaDeFormulario>
            Falta enviar o comprovante profissional.
          </AlertaDeFormulario>
        )}

        {resumo && <p className="text-sm text-verde-health/80">{resumo}</p>}

        {recusado && (
          <AlertaDeFormulario variante="erro">
            Seu comprovante não foi aprovado. Envie um novo ou fale com a gente
            pelo{' '}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-dourado-health hover:underline"
            >
              WhatsApp
            </a>
            .
          </AlertaDeFormulario>
        )}

        {envio === 'enviado' && (
          <AlertaDeFormulario>
            Comprovante recebido. Ele será analisado na primeira compra.
          </AlertaDeFormulario>
        )}
      </div>

      {!mostrarSeletor && enviados !== null && enviados.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setSeletorAberto(true)
            setEnvio('ocioso')
          }}
          className="mt-4 text-sm font-medium text-dourado-health hover:underline"
        >
          Enviar outro comprovante
        </button>
      )}

      {mostrarSeletor && (
        <div>
          <SeletorDeComprovante
            arquivo={arquivo}
            onArquivoChange={setArquivo}
            confirmado={confirmado}
            onConfirmadoChange={setConfirmado}
            disabled={envio === 'enviando'}
          />

          {envio === 'enviando' && (
            <div className="mt-6">
              <AlertaDeFormulario>
                Enviando seu comprovante. Não feche esta página.
              </AlertaDeFormulario>
            </div>
          )}
          {envio === 'erro' && erroDoEnvio && (
            <div className="mt-6">
              <AlertaDeFormulario variante="erro">
                {erroDoEnvio.message}
              </AlertaDeFormulario>
            </div>
          )}

          <PrimaryButton
            className="mt-6"
            disabled={!arquivo || !confirmado || envio === 'enviando'}
            onClick={handleEnviar}
          >
            {envio === 'enviando'
              ? 'Enviando...'
              : envio === 'erro'
                ? 'Tentar enviar de novo'
                : 'Enviar comprovante'}
          </PrimaryButton>
        </div>
      )}
    </section>
  )
}

// Área da conta: dados da pessoa, comprovante (só profissional) e Sair. A
// sessão vem do AuthContext (cookies httpOnly); nada daqui vai para storage.
function MinhaConta() {
  const { status, usuario, perfil, sair } = useAuth()
  const navigate = useNavigate()
  const [saindo, setSaindo] = useState(false)

  if (status === 'carregando') {
    return (
      <section className="mx-auto w-full max-w-xl py-12 text-center">
        <p className="text-sm text-verde-health/70" role="status">
          Carregando sua conta...
        </p>
      </section>
    )
  }

  // Sem sessão: vai para o login e volta para cá depois de entrar
  if (status === 'deslogado' || !usuario || !perfil) {
    return <Navigate to="/login?destino=/minha-conta" replace />
  }

  async function handleSair() {
    if (saindo) return
    setSaindo(true)
    await sair()
    navigate('/', { replace: true })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Minha conta
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Seus dados e o andamento do seu cadastro.
        </p>
      </div>

      <dl className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#04452E]/10 bg-white/60 p-5 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] backdrop-blur-sm">
        <Dado rotulo="Nome" valor={perfil.nome} />
        <Dado rotulo="E-mail" valor={usuario.email} />
        <Dado rotulo="Conta" valor={rotuloDoPerfil(perfil)} />
      </dl>

      {podeEnviarComprovante(perfil) ? (
        <SecaoDoComprovante recusado={perfil.status === 'recusado'} />
      ) : perfil.tipo === 'homecare' ? (
        <p className="mt-6 text-sm text-verde-health/70">
          Sua conta é Home Care. Não é preciso enviar comprovante.
        </p>
      ) : null}

      <div className="mt-10 border-t border-[#04452E]/10 pt-6">
        <button
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className="w-full rounded-full border border-[#04452E]/20 px-8 py-3 text-sm font-medium text-verde-health transition-colors hover:border-dourado-health/60 hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </motion.section>
  )
}

export default MinhaConta
