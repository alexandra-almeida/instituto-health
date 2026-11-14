import { useState } from 'react'
import { ApiError, api } from '../../lib/api'
import type { ProfissionalNaLista } from '../../lib/api'
import { dataOuTraco, rotuloDaAvaliacao } from '../../lib/admin'
import type { AcaoDeDecisao } from './DialogoDeDecisao'

const BOTAO =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-xs font-medium tracking-wide text-verde-health/55 uppercase sm:w-36 sm:shrink-0 sm:pt-0.5">
        {rotulo}
      </dt>
      <dd className="min-w-0 text-sm break-words text-verde-health">{valor}</dd>
    </div>
  )
}

interface CartaoDeProfissionalProps {
  profissional: ProfissionalNaLista
  onDecidir: (acao: AcaoDeDecisao) => void
}

// Um profissional na lista. Em "Pendentes" tem Aprovar e Recusar; em
// Aprovados e Recusados é só leitura (quem decidiu, quando e o motivo).
function CartaoDeProfissional({
  profissional,
  onDecidir,
}: CartaoDeProfissionalProps) {
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [maisRecente, ...anteriores] = profissional.comprovantes
  const pendente = profissional.status === 'pendente'

  // A aba abre ANTES de pedir a URL (o navegador só deixa abrir aba em
  // resposta direta a um clique) e depois é levada à URL assinada, que vale 5
  // minutos e nunca é mostrada nem guardada. A aba nova não recebe referência
  // a esta (opener nulo).
  async function verComprovante(id: string) {
    setErro(null)
    const aba = window.open('', '_blank')
    if (!aba) {
      setErro(
        'O navegador bloqueou a nova aba. Permita pop-ups para este site e tente de novo.',
      )
      return
    }
    aba.opener = null
    setAbrindo(id)
    try {
      const { url } = await api.admin.urlDoComprovante(id)
      aba.location.href = url
    } catch (falha) {
      aba.close()
      setErro(
        falha instanceof ApiError
          ? falha.message
          : 'Não foi possível abrir o comprovante. Tente de novo.',
      )
    } finally {
      setAbrindo(null)
    }
  }

  return (
    <li className="rounded-2xl border border-[#04452E]/10 bg-white/60 p-4 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] sm:p-5">
      <h3 className="text-base font-medium break-words text-verde-health">
        {profissional.nome}
      </h3>

      <dl className="mt-3 flex flex-col gap-2">
        <Linha rotulo="E-mail" valor={profissional.email ?? 'Sem e-mail'} />
        {profissional.telefone && (
          <Linha rotulo="Telefone" valor={profissional.telefone} />
        )}
        {profissional.registroProfissional && (
          <Linha rotulo="Registro" valor={profissional.registroProfissional} />
        )}
        <Linha rotulo="Cadastro" valor={dataOuTraco(profissional.criadoEm)} />
        <Linha
          rotulo="Último comprovante"
          valor={
            profissional.ultimoComprovanteEm
              ? dataOuTraco(profissional.ultimoComprovanteEm)
              : 'Nenhum comprovante enviado'
          }
        />
      </dl>

      {profissional.avaliacao && (
        <p className="mt-3 rounded-xl bg-verde-health/5 px-3 py-2 text-sm break-words text-verde-health/85">
          {pendente ? 'Antes: ' : ''}
          {rotuloDaAvaliacao(profissional.avaliacao)}
          {profissional.avaliacao.motivo
            ? `. Motivo: ${profissional.avaliacao.motivo}`
            : ''}
        </p>
      )}

      {erro && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-300/60 bg-red-50/70 px-3 py-2 text-sm text-red-700"
        >
          {erro}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {maisRecente ? (
          <button
            type="button"
            onClick={() => verComprovante(maisRecente.id)}
            disabled={abrindo !== null}
            className={`${BOTAO} border border-[#04452E]/25 text-verde-health hover:border-dourado-health/60 hover:text-dourado-health`}
          >
            {abrindo === maisRecente.id ? 'Abrindo...' : 'Ver comprovante'}
          </button>
        ) : (
          <p className="text-sm text-verde-health/60">
            Ainda sem comprovante para ver.
          </p>
        )}

        {pendente && (
          <>
            <button
              type="button"
              onClick={() => onDecidir('aprovar')}
              className={`${BOTAO} bg-verde-health text-offwhite hover:bg-verde-health/90`}
            >
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => onDecidir('recusar')}
              className={`${BOTAO} border border-red-300 text-red-700 hover:bg-red-50`}
            >
              Recusar
            </button>
          </>
        )}
      </div>

      {anteriores.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-dourado-health">
            Comprovantes anteriores ({anteriores.length})
          </summary>
          <ul className="flex flex-col gap-2">
            {anteriores.map((comprovante) => (
              <li key={comprovante.id}>
                <button
                  type="button"
                  onClick={() => verComprovante(comprovante.id)}
                  disabled={abrindo !== null}
                  className={`${BOTAO} border border-[#04452E]/15 text-verde-health hover:border-dourado-health/60`}
                >
                  {abrindo === comprovante.id
                    ? 'Abrindo...'
                    : `Ver o de ${dataOuTraco(comprovante.enviadoEm)}`}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}

export default CartaoDeProfissional
