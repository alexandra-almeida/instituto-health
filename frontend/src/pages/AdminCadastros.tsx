import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import CartaoDeProfissional from '../components/admin/CartaoDeProfissional'
import { CampoDeBusca, Paginacao } from '../components/admin/ControlesDaLista'
import DialogoDeDecisao from '../components/admin/DialogoDeDecisao'
import type { AcaoDeDecisao } from '../components/admin/DialogoDeDecisao'
import { useListaPaginada } from '../components/admin/useListaPaginada'
import AlertaDeFormulario from '../components/AlertaDeFormulario'
import { useAuth } from '../context/useAuth'
import { api } from '../lib/api'
import type {
  HomeCareNaLista,
  ProfissionalNaLista,
  ResumoDeCadastros,
  StatusDoPerfil,
} from '../lib/api'
import { ABAS, contagemDaSecao, dataOuTraco, rotuloDaAba } from '../lib/admin'

function Estado({
  carregando,
  erro,
  vazio,
  onTentarDeNovo,
}: {
  carregando: boolean
  erro: { message: string } | null
  vazio: string | null
  onTentarDeNovo: () => void
}) {
  if (erro) {
    return (
      <AlertaDeFormulario variante="erro">
        <p>{erro.message}</p>
        <button
          type="button"
          onClick={onTentarDeNovo}
          className="mt-2 min-h-11 font-medium text-dourado-health hover:underline"
        >
          Tentar de novo
        </button>
      </AlertaDeFormulario>
    )
  }
  if (carregando) {
    return (
      <p className="py-6 text-center text-sm text-verde-health/70">
        Carregando...
      </p>
    )
  }
  if (vazio) {
    return (
      <p className="py-6 text-center text-sm text-verde-health/70">{vazio}</p>
    )
  }
  return null
}

function CartaoDeHomeCare({ cadastro }: { cadastro: HomeCareNaLista }) {
  return (
    <li className="rounded-2xl border border-[#04452E]/10 bg-white/60 p-4 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)]">
      <h3 className="text-base font-medium break-words text-verde-health">
        {cadastro.nome}
      </h3>
      <dl className="mt-2 flex flex-col gap-1 text-sm text-verde-health/85">
        <div className="break-words">{cadastro.email ?? 'Sem e-mail'}</div>
        {cadastro.telefone && <div>{cadastro.telefone}</div>}
        <div className="text-verde-health/60">
          Cadastro em {dataOuTraco(cadastro.criadoEm)}
        </div>
      </dl>
    </li>
  )
}

function SecaoDeProfissionais({
  resumo,
  onDecidir,
  registrarRecarga,
}: {
  resumo: ResumoDeCadastros | null
  onDecidir: (profissional: ProfissionalNaLista, acao: AcaoDeDecisao) => void
  registrarRecarga: (recarregar: () => void) => void
}) {
  const [aba, setAba] = useState<StatusDoPerfil>('pendente')
  const lista = useListaPaginada<ProfissionalNaLista>({
    chave: aba,
    buscar: (pagina, busca) =>
      api.admin.listarProfissionais({
        status: aba,
        busca: busca || undefined,
        pagina,
      }),
  })
  const { recarregar, irParaPagina, pagina, dados } = lista

  // A página que ficou vazia (última decisão de uma página) volta uma casa
  useEffect(() => {
    if (dados && dados.itens.length === 0 && pagina > 1)
      irParaPagina(pagina - 1)
  }, [dados, pagina, irParaPagina])

  useEffect(() => registrarRecarga(recarregar), [recarregar, registrarRecarga])

  const somaDoResumo = resumo
    ? resumo.profissionais.pendente +
      resumo.profissionais.aprovado +
      resumo.profissionais.recusado
    : null

  return (
    <section className="mt-8" aria-labelledby="titulo-profissionais">
      <h2
        id="titulo-profissionais"
        className="font-flatline text-xl text-verde-health"
      >
        {somaDoResumo === null
          ? 'Profissionais'
          : contagemDaSecao('Profissionais', somaDoResumo)}
      </h2>

      <div
        role="tablist"
        aria-label="Situação do cadastro"
        className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {ABAS.map(({ status, rotulo }) => {
          const ativa = status === aba
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(status)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-medium transition-colors ${
                ativa
                  ? 'border-dourado-health bg-dourado-health text-verde-profundo'
                  : 'border-[#04452E]/20 text-verde-health hover:border-dourado-health/60'
              }`}
            >
              {rotuloDaAba(rotulo, resumo?.profissionais[status])}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <CampoDeBusca
          valor={lista.texto}
          onChange={lista.setTexto}
          rotulo="Buscar profissionais por nome ou e-mail"
        />
      </div>

      <div role="tabpanel" className="mt-4">
        <Estado
          carregando={lista.carregando && !lista.dados}
          erro={lista.erro}
          vazio={
            !lista.carregando && lista.dados?.total === 0
              ? lista.busca
                ? 'Nenhum cadastro encontrado para essa busca.'
                : 'Nenhum cadastro nesta aba.'
              : null
          }
          onTentarDeNovo={lista.recarregar}
        />
        {lista.dados && lista.dados.itens.length > 0 && (
          <ul
            className={`flex flex-col gap-3 transition-opacity ${lista.carregando ? 'opacity-60' : ''}`}
          >
            {lista.dados.itens.map((profissional) => (
              <CartaoDeProfissional
                key={profissional.id}
                profissional={profissional}
                onDecidir={(acao) => onDecidir(profissional, acao)}
              />
            ))}
          </ul>
        )}
        {lista.dados && (
          <Paginacao
            pagina={lista.pagina}
            totalDePaginas={lista.dados.totalDePaginas}
            porPagina={lista.dados.porPagina}
            total={lista.dados.total}
            carregando={lista.carregando}
            onMudar={lista.irParaPagina}
          />
        )}
      </div>
    </section>
  )
}

function SecaoDeHomeCare({ resumo }: { resumo: ResumoDeCadastros | null }) {
  const lista = useListaPaginada<HomeCareNaLista>({
    chave: 'homecare',
    buscar: (pagina, busca) =>
      api.admin.listarHomeCare({ busca: busca || undefined, pagina }),
  })

  return (
    <section className="mt-12" aria-labelledby="titulo-homecare">
      <h2
        id="titulo-homecare"
        className="font-flatline text-xl text-verde-health"
      >
        {resumo ? contagemDaSecao('Home Care', resumo.homecare) : 'Home Care'}
      </h2>
      <p className="mt-1 text-sm text-verde-health/70">
        Só para consulta: contas Home Care não precisam de aprovação.
      </p>

      <div className="mt-4">
        <CampoDeBusca
          valor={lista.texto}
          onChange={lista.setTexto}
          rotulo="Buscar cadastros Home Care por nome ou e-mail"
        />
      </div>

      <div className="mt-4">
        <Estado
          carregando={lista.carregando && !lista.dados}
          erro={lista.erro}
          vazio={
            !lista.carregando && lista.dados?.total === 0
              ? lista.busca
                ? 'Nenhum cadastro encontrado para essa busca.'
                : 'Nenhum cadastro Home Care ainda.'
              : null
          }
          onTentarDeNovo={lista.recarregar}
        />
        {lista.dados && lista.dados.itens.length > 0 && (
          <ul
            className={`flex flex-col gap-3 transition-opacity ${lista.carregando ? 'opacity-60' : ''}`}
          >
            {lista.dados.itens.map((cadastro) => (
              <CartaoDeHomeCare key={cadastro.id} cadastro={cadastro} />
            ))}
          </ul>
        )}
        {lista.dados && (
          <Paginacao
            pagina={lista.pagina}
            totalDePaginas={lista.dados.totalDePaginas}
            porPagina={lista.dados.porPagina}
            total={lista.dados.total}
            carregando={lista.carregando}
            onMudar={lista.irParaPagina}
          />
        )}
      </div>
    </section>
  )
}

// Tela de cadastros (só admin; ver RotaDeAdmin e o backend). Duas seções:
// Profissionais (com aprovar e recusar) e Home Care (só consulta).
function AdminCadastros() {
  const { atualizarPendentes } = useAuth()
  const [resumo, setResumo] = useState<ResumoDeCadastros | null>(null)
  const [decisao, setDecisao] = useState<{
    profissional: ProfissionalNaLista
    acao: AcaoDeDecisao
  } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [recarregarProfissionais, setRecarregarProfissionais] = useState<
    (() => void) | null
  >(null)

  const carregarResumo = useCallback(() => {
    api.admin
      .resumo()
      .then(setResumo)
      .catch(() => {})
  }, [])
  useEffect(carregarResumo, [carregarResumo])

  // A lista entrega sua função de recarregar (setState com função precisa do
  // embrulho extra, senão o React a chamaria como atualizador)
  const registrarRecarga = useCallback((recarregar: () => void) => {
    setRecarregarProfissionais(() => recarregar)
  }, [])

  function fecharDialogo(atualizar: boolean) {
    setDecisao(null)
    if (atualizar) atualizarTudo()
  }

  function atualizarTudo() {
    recarregarProfissionais?.()
    carregarResumo()
    atualizarPendentes()
  }

  function decisaoConcluida(acao: AcaoDeDecisao) {
    const nome = decisao?.profissional.nome ?? 'O cadastro'
    setAviso(
      acao === 'aprovar'
        ? `Cadastro de ${nome} aprovado.`
        : `Cadastro de ${nome} recusado.`,
    )
    setDecisao(null)
    atualizarTudo()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-3xl py-8 sm:py-12"
    >
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Cadastros
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Aprove os profissionais e consulte quem se cadastrou.
        </p>
      </div>

      {aviso && (
        <div className="mt-6">
          <AlertaDeFormulario>
            <div className="flex items-start justify-between gap-3">
              <span>{aviso}</span>
              <button
                type="button"
                onClick={() => setAviso(null)}
                aria-label="Fechar aviso"
                className="-my-2 -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center text-lg leading-none text-verde-health/60 hover:text-verde-health"
              >
                ×
              </button>
            </div>
          </AlertaDeFormulario>
        </div>
      )}

      <SecaoDeProfissionais
        resumo={resumo}
        onDecidir={(profissional, acao) => {
          setAviso(null)
          setDecisao({ profissional, acao })
        }}
        registrarRecarga={registrarRecarga}
      />
      <SecaoDeHomeCare resumo={resumo} />

      {decisao && (
        <DialogoDeDecisao
          profissional={decisao.profissional}
          acao={decisao.acao}
          onFechar={fecharDialogo}
          onConcluido={decisaoConcluida}
        />
      )}
    </motion.section>
  )
}

export default AdminCadastros
