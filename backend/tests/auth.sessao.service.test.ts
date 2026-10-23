import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'
import type { PerfisRepository } from '../src/repositories/perfis.repository.js'
import {
  FalhaDoSupabaseAuth,
  type AuthClient,
} from '../src/modules/auth/auth.client.js'
import { criarAuthService } from '../src/modules/auth/auth.service.js'

// Supabase e repository simulados: nenhum teste aqui toca o banco de verdade
function criarFakes() {
  const auth = {
    criarUsuario: vi.fn<AuthClient['criarUsuario']>(),
    apagarUsuario: vi.fn<AuthClient['apagarUsuario']>(),
    enviarCodigoDeConfirmacao: vi.fn<AuthClient['enviarCodigoDeConfirmacao']>(),
    confirmarCodigo: vi.fn<AuthClient['confirmarCodigo']>(),
    entrar: vi.fn<AuthClient['entrar']>(),
    validarToken: vi.fn<AuthClient['validarToken']>(),
    renovarSessao: vi.fn<AuthClient['renovarSessao']>(),
    encerrarSessao: vi.fn<AuthClient['encerrarSessao']>(),
    enviarCodigoDeRecuperacao: vi.fn<AuthClient['enviarCodigoDeRecuperacao']>(),
    redefinirSenha: vi.fn<AuthClient['redefinirSenha']>(),
  }
  const perfis = {
    criar: vi.fn<PerfisRepository['criar']>(),
    buscarPorId: vi.fn<PerfisRepository['buscarPorId']>(),
  }
  perfis.buscarPorId.mockResolvedValue({
    id: 'u-1',
    nome: 'Maria',
    tipo: 'homecare',
    status: 'aprovado',
    is_admin: true,
  })
  return { auth, perfis, service: criarAuthService({ auth, perfis }) }
}

const usuario = { id: 'u-1', email: 'maria@exemplo.com' }
const sessao = { accessToken: 'acesso', refreshToken: 'renov', expiresIn: 3600 }

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('entrar', () => {
  const entrada = { email: 'maria@exemplo.com', senha: 'senha-forte-1' }

  it('abre a sessão e devolve só nome, tipo e status do perfil', async () => {
    const { service, auth } = criarFakes()
    auth.entrar.mockResolvedValue({ usuario, sessao })

    const resultado = await service.entrar(entrada)

    expect(resultado).toEqual({
      sessao,
      usuario,
      perfil: { nome: 'Maria', tipo: 'homecare', status: 'aprovado' },
    })
    // is_admin não pode sair do service para o controller
    expect(resultado.perfil).not.toHaveProperty('is_admin')
  })

  it('senha errada vira 401 com mensagem genérica', async () => {
    const { service, auth } = criarFakes()
    auth.entrar.mockRejectedValue(
      new FalhaDoSupabaseAuth('credenciais_invalidas', 'invalid_credentials'),
    )

    await expect(service.entrar(entrada)).rejects.toMatchObject({
      codigo: 'credenciais_invalidas',
      status: 401,
      message: 'E-mail ou senha incorretos.',
    })
  })

  it('e-mail ainda não confirmado vira 403 com orientação', async () => {
    const { service, auth } = criarFakes()
    auth.entrar.mockRejectedValue(
      new FalhaDoSupabaseAuth('email_nao_confirmado', 'email_not_confirmed'),
    )

    await expect(service.entrar(entrada)).rejects.toMatchObject({
      codigo: 'email_nao_confirmado',
      status: 403,
    })
  })

  it('limite do Supabase vira 429', async () => {
    const { service, auth } = criarFakes()
    auth.entrar.mockRejectedValue(
      new FalhaDoSupabaseAuth('limite_de_envio', 'over_request_rate_limit'),
    )

    await expect(service.entrar(entrada)).rejects.toMatchObject({ status: 429 })
  })

  it('não abre sessão de conta sem perfil', async () => {
    const { service, auth, perfis } = criarFakes()
    auth.entrar.mockResolvedValue({ usuario, sessao })
    perfis.buscarPorId.mockResolvedValue(null)

    await expect(service.entrar(entrada)).rejects.toThrow('sem perfil')
  })

  it('erro inesperado do Supabase segue como erro (500)', async () => {
    const { service, auth } = criarFakes()
    auth.entrar.mockRejectedValue(
      new FalhaDoSupabaseAuth('desconhecido', 'unexpected_failure'),
    )

    const erro = await service.entrar(entrada).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(FalhaDoSupabaseAuth)
    expect(erro).not.toBeInstanceOf(ErroDeNegocio)
  })
})

describe('sair', () => {
  it('encerra a sessão do token informado', async () => {
    const { service, auth } = criarFakes()
    auth.encerrarSessao.mockResolvedValue()

    await service.sair('acesso')

    expect(auth.encerrarSessao).toHaveBeenCalledWith('acesso')
  })

  it('sem token não chama o Supabase', async () => {
    const { service, auth } = criarFakes()

    await service.sair(undefined)

    expect(auth.encerrarSessao).not.toHaveBeenCalled()
  })

  it('não falha se o Supabase recusar (token vencido)', async () => {
    const { service, auth } = criarFakes()
    auth.encerrarSessao.mockRejectedValue(
      new FalhaDoSupabaseAuth('sessao_invalida', 'bad_jwt'),
    )

    await expect(service.sair('vencido')).resolves.toBeUndefined()
  })
})

describe('autenticarSessao', () => {
  it('token de acesso válido: devolve usuário e perfil sem renovar', async () => {
    const { service, auth } = criarFakes()
    auth.validarToken.mockResolvedValue(usuario)

    const resultado = await service.autenticarSessao({
      accessToken: 'acesso',
      refreshToken: 'renov',
    })

    expect(resultado.usuario).toEqual(usuario)
    expect(resultado.perfil).toEqual({
      nome: 'Maria',
      tipo: 'homecare',
      status: 'aprovado',
    })
    expect(resultado.sessaoRenovada).toBeUndefined()
    expect(auth.renovarSessao).not.toHaveBeenCalled()
  })

  it('token de acesso vencido: renova com o de renovação', async () => {
    const { service, auth } = criarFakes()
    auth.validarToken.mockRejectedValue(
      new FalhaDoSupabaseAuth('sessao_invalida', 'bad_jwt'),
    )
    auth.renovarSessao.mockResolvedValue({ usuario, sessao })

    const resultado = await service.autenticarSessao({
      accessToken: 'vencido',
      refreshToken: 'renov',
    })

    expect(auth.renovarSessao).toHaveBeenCalledWith('renov')
    expect(resultado.sessaoRenovada).toEqual(sessao)
    expect(resultado.usuario).toEqual(usuario)
  })

  it('cookie de acesso ausente (venceu no navegador): renova', async () => {
    const { service, auth } = criarFakes()
    auth.renovarSessao.mockResolvedValue({ usuario, sessao })

    const resultado = await service.autenticarSessao({ refreshToken: 'renov' })

    expect(auth.validarToken).not.toHaveBeenCalled()
    expect(resultado.sessaoRenovada).toEqual(sessao)
  })

  it('sem cookies: 401', async () => {
    const { service } = criarFakes()

    await expect(service.autenticarSessao({})).rejects.toMatchObject({
      codigo: 'nao_autenticado',
      status: 401,
    })
  })

  it('os dois tokens inválidos: 401', async () => {
    const { service, auth } = criarFakes()
    auth.validarToken.mockRejectedValue(
      new FalhaDoSupabaseAuth('sessao_invalida', 'bad_jwt'),
    )
    auth.renovarSessao.mockRejectedValue(
      new FalhaDoSupabaseAuth('sessao_invalida', 'refresh_token_not_found'),
    )

    await expect(
      service.autenticarSessao({ accessToken: 'a', refreshToken: 'r' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('falha que não é de sessão (Supabase fora do ar) não vira 401', async () => {
    const { service, auth } = criarFakes()
    auth.validarToken.mockRejectedValue(
      new FalhaDoSupabaseAuth('desconhecido', 'unexpected_failure'),
    )

    const erro = await service
      .autenticarSessao({ accessToken: 'a', refreshToken: 'r' })
      .catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(FalhaDoSupabaseAuth)
    expect(auth.renovarSessao).not.toHaveBeenCalled()
  })

  it('usuário sem perfil: 401', async () => {
    const { service, auth, perfis } = criarFakes()
    auth.validarToken.mockResolvedValue(usuario)
    perfis.buscarPorId.mockResolvedValue(null)

    await expect(
      service.autenticarSessao({ accessToken: 'a' }),
    ).rejects.toMatchObject({ status: 401 })
  })
})

describe('esqueciSenha', () => {
  it('pede o código de recuperação e responde a mensagem padrão', async () => {
    const { service, auth } = criarFakes()
    auth.enviarCodigoDeRecuperacao.mockResolvedValue()

    const resposta = await service.esqueciSenha({ email: 'maria@exemplo.com' })

    expect(auth.enviarCodigoDeRecuperacao).toHaveBeenCalledWith(
      'maria@exemplo.com',
    )
    expect(resposta.mensagem).toMatch(/^Se o e-mail estiver cadastrado/)
  })

  it('responde igual quando o envio falha, sem logar o e-mail', async () => {
    const { service, auth } = criarFakes()
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    auth.enviarCodigoDeRecuperacao.mockRejectedValue(
      new FalhaDoSupabaseAuth('limite_de_envio', 'over_email_send_rate_limit'),
    )

    const resposta = await service.esqueciSenha({ email: 'maria@exemplo.com' })

    expect(resposta.mensagem).toMatch(/^Se o e-mail estiver cadastrado/)
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('over_email'))
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('maria@')
  })
})

describe('redefinirSenha', () => {
  const entrada = {
    email: 'maria@exemplo.com',
    codigo: '123456',
    novaSenha: 'nova-senha-1',
  }

  it('troca a senha e não devolve sessão', async () => {
    const { service, auth } = criarFakes()
    auth.redefinirSenha.mockResolvedValue()

    const resposta = await service.redefinirSenha(entrada)

    expect(auth.redefinirSenha).toHaveBeenCalledWith(
      'maria@exemplo.com',
      '123456',
      'nova-senha-1',
    )
    expect(resposta).toEqual({
      mensagem: 'Senha alterada. Entre com a nova senha.',
    })
  })

  it.each([
    ['codigo_invalido', 'codigo_invalido', 400],
    ['senha_fraca', 'senha_fraca', 400],
    ['senha_igual', 'senha_igual', 400],
    ['limite_de_envio', 'muitas_tentativas', 429],
  ] as const)('traduz %s', async (motivo, codigo, status) => {
    const { service, auth } = criarFakes()
    auth.redefinirSenha.mockRejectedValue(
      new FalhaDoSupabaseAuth(motivo, 'qualquer'),
    )

    await expect(service.redefinirSenha(entrada)).rejects.toMatchObject({
      codigo,
      status,
    })
  })
})
