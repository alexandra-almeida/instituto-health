import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ErroDeNegocio } from '../lib/erros.js'

// Erros que o próprio express.json() lança ao ler o corpo. Eles têm um
// campo `type` próprio; tratamos à parte para não virarem 500.
type ErroDoCorpo = Error & { type?: string }

function respostaParaErroDoCorpo(erro: ErroDoCorpo): ErroDeNegocio | null {
  if (erro.type === 'entity.parse.failed') {
    return new ErroDeNegocio(
      'json_invalido',
      'Não foi possível ler os dados enviados.',
    )
  }
  if (erro.type === 'entity.too.large') {
    return new ErroDeNegocio(
      'corpo_muito_grande',
      'Os dados enviados são grandes demais.',
      413,
    )
  }
  return null
}

// Qualquer caminho não declarado responde no mesmo formato JSON dos erros,
// em vez da página HTML padrão do Express
export const rotaNaoEncontrada: RequestHandler = (_req, _res, next) => {
  next(
    new ErroDeNegocio('rota_nao_encontrada', 'Endereço não encontrado.', 404),
  )
}

// Precisa ter os 4 parâmetros para o Express reconhecer como tratador de
// erros. A documentação da Vercel alerta que erros não tratados podem deixar
// a Function num estado indefinido; por isso tudo termina aqui.
export const tratarErros: ErrorRequestHandler = (erro, _req, res, next) => {
  if (res.headersSent) {
    next(erro)
    return
  }

  const conhecido =
    erro instanceof ErroDeNegocio ? erro : respostaParaErroDoCorpo(erro)

  if (conhecido) {
    res.status(conhecido.status).json({
      erro: { codigo: conhecido.codigo, mensagem: conhecido.message },
    })
    return
  }

  // Erro inesperado: o detalhe vai só para o log, o cliente recebe uma
  // mensagem genérica que não expõe nada do servidor
  console.error(erro)
  res.status(500).json({
    erro: {
      codigo: 'erro_interno',
      mensagem: 'Algo deu errado. Tente novamente em instantes.',
    },
  })
}
