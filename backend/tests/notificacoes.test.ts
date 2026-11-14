import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarNotificacoes } from '../src/modules/notificacoes/notificacoes.service.js'
import {
  EMAIL_DA_CLINICA,
  escaparHtml,
  LINK_DA_TELA_DE_CADASTROS,
  LINK_DE_MINHA_CONTA,
  SITE,
  textoDeAprovado,
  textoDeNovoComprovante,
  textoDeRecusado,
} from '../src/modules/notificacoes/notificacoes.textos.js'

describe('textos dos e-mails', () => {
  const todos = [
    textoDeNovoComprovante('Maria Souza'),
    textoDeAprovado('Maria Souza'),
    textoDeRecusado('Maria Souza', 'Comprovante ilegível'),
  ]

  it('não usam travessão (texto, HTML e assunto)', () => {
    for (const { assunto, texto, html } of todos) {
      expect(`${assunto}\n${texto}\n${html}`).not.toMatch(/[—–]/)
    }
  })

  it('aviso para a clínica: assunto aprovado, só o nome e o link da tela, nada sensível', () => {
    const { assunto, texto, html } = textoDeNovoComprovante('Maria Souza')

    expect(assunto).toBe('Novo profissional aguardando aprovação')
    expect(texto).toContain(
      'O cadastro de Maria Souza está aguardando aprovação.',
    )
    expect(texto).toContain(
      `Para analisar, acesse: ${LINK_DA_TELA_DE_CADASTROS}`,
    )
    expect(LINK_DA_TELA_DE_CADASTROS).toBe(
      'https://healthinstituto.com.br/admin/cadastros',
    )
    // Sem e-mail, telefone, anexo nem link de arquivo
    expect(`${texto}${html}`).not.toMatch(/@|storage|token|\.pdf|\.png|\.jpg/i)
  })

  it('aprovado: usa a frase combinada e leva ao site', () => {
    const { assunto, texto } = textoDeAprovado('Maria Souza')

    expect(assunto).toBe('Seu cadastro foi aprovado')
    expect(texto).toContain(
      'Seu cadastro profissional no Instituto Health foi aprovado. Agora sua conta profissional está ativa.',
    )
    expect(texto).not.toContain('já pode entrar')
    expect(texto).toContain(`Acessar o site: ${SITE}`)
  })

  it('recusado: leva o motivo e explica como reenviar em Minha Conta', () => {
    const { assunto, texto } = textoDeRecusado(
      'Maria Souza',
      'Comprovante ilegível',
    )

    expect(assunto).toBe('Não conseguimos aprovar seu cadastro')
    expect(texto).toContain('Motivo: Comprovante ilegível')
    expect(texto).toContain('abra Minha Conta e envie um novo comprovante')
    expect(texto).toContain(LINK_DE_MINHA_CONTA)
  })

  it('o que vem de uma pessoa é escapado no HTML e fica em uma linha só', () => {
    const { html, texto } = textoDeRecusado(
      'Maria <b>',
      'Fraude</p><script>alert(1)</script>\nSegunda linha',
    )

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;script&gt;')
    expect(texto).toContain(
      'Motivo: Fraude</p><script>alert(1)</script> Segunda linha',
    )
  })

  it('escaparHtml cobre os cinco caracteres perigosos', () => {
    expect(escaparHtml(`<a href="x">&'`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
    )
  })
})

describe('criarNotificacoes: nunca lança e nunca vaza dados', () => {
  const enviar = vi.fn()
  const erro = vi.spyOn(console, 'error')
  const aviso = vi.spyOn(console, 'warn')

  beforeEach(() => {
    vi.resetAllMocks()
    erro.mockImplementation(() => {})
    aviso.mockImplementation(() => {})
  })

  it('novo comprovante vai para contato@ com o texto combinado', async () => {
    enviar.mockResolvedValue(undefined)

    await criarNotificacoes({ enviar }).avisarNovoComprovante('Maria Souza')

    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        para: EMAIL_DA_CLINICA,
        assunto: 'Novo profissional aguardando aprovação',
      }),
    )
    expect(EMAIL_DA_CLINICA).toBe('contato@healthinstituto.com.br')
  })

  it('aprovado e recusado vão para o e-mail do profissional', async () => {
    enviar.mockResolvedValue(undefined)
    const notificacoes = criarNotificacoes({ enviar })
    const contato = { nome: 'Maria', email: 'maria@exemplo.com' }

    await notificacoes.avisarAprovado(contato)
    await notificacoes.avisarRecusado(contato, 'Documento vencido')

    expect(enviar).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        para: 'maria@exemplo.com',
        assunto: 'Seu cadastro foi aprovado',
      }),
    )
    expect(enviar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        para: 'maria@exemplo.com',
        assunto: 'Não conseguimos aprovar seu cadastro',
        texto: expect.stringContaining('Motivo: Documento vencido'),
      }),
    )
  })

  it('falha no envio não lança e o log leva só o tipo do aviso', async () => {
    enviar.mockRejectedValue(new Error('O Resend respondeu 500'))

    await expect(
      criarNotificacoes({ enviar }).avisarRecusado(
        { nome: 'Maria Souza', email: 'maria@exemplo.com' },
        'Comprovante ilegível',
      ),
    ).resolves.toBeUndefined()

    const registrado = JSON.stringify(erro.mock.calls)
    expect(registrado).toContain('recusado')
    expect(registrado).not.toMatch(/Maria|maria@|ilegível/)
  })

  it('cadastro sem e-mail: não tenta enviar e não lança', async () => {
    await expect(
      criarNotificacoes({ enviar }).avisarAprovado({
        nome: 'Maria',
        email: null,
      }),
    ).resolves.toBeUndefined()

    expect(enviar).not.toHaveBeenCalled()
  })
})
