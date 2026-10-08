// Erro previsto pela regra de negócio. O middleware tratarErros devolve o
// código e a mensagem ao cliente; por isso a mensagem já vem em português,
// pronta para exibir na tela.
export class ErroDeNegocio extends Error {
  readonly codigo: string
  readonly status: number

  constructor(codigo: string, mensagem: string, status = 400) {
    super(mensagem)
    this.name = 'ErroDeNegocio'
    this.codigo = codigo
    this.status = status
  }
}
