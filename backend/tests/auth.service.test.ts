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
  }
  const perfis = {
    criar: vi.fn<PerfisRepository['criar']>(),
    buscarPorId: vi.fn<PerfisRepository['buscarPorId']>(),
  }
  auth.criarUsuario.mockResolvedValue({ id: 'u-1' })
  auth.apagarUsuario.mockResolvedValue()
  auth.enviarCodigoDeConfirmacao.mockResolvedValue()
  perfis.criar.mockResolvedValue()
  return { auth, perfis, service: criarAuthService({ auth, perfis }) }
}

const cadastro = {
  perfil: 'homecare' as const,
  nome: 'Maria',
  email: 'maria@exemplo.com',
  senha: 'senha-forte-1',
}

beforeEach(() => {
  // Os logs de aviso esperados não devem poluir a saída dos testes
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('cadastrar', () => {
  it('homecare nasce aprovado', async () => {
    const { service, perfis } = criarFakes()

    await service.cadastrar(cadastro)

    expect(perfis.criar).toHaveBeenCalledWith({
      id: 'u-1',
      nome: 'Maria',
      tipo: 'homecare',
      status: 'aprovado',
    })
  })

  it('profissional nasce pendente', async () => {
    const { service, perfis } = criarFakes()

    await service.cadastrar({ ...cadastro, perfil: 'profissional' })

    expect(perfis.criar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'profissional', status: 'pendente' }),
    )
  })

  it('cria o usuário sem confirmar e envia o código', async () => {
    const { service, auth } = criarFakes()

    await service.cadastrar(cadastro)

    expect(auth.criarUsuario).toHaveBeenCalledWith(
      'maria@exemplo.com',
      'senha-forte-1',
    )
    expect(auth.enviarCodigoDeConfirmacao).toHaveBeenCalledWith(
      'maria@exemplo.com',
    )
  })

  it('desfaz o usuário se a criação do perfil falhar', async () => {
    const { service, auth, perfis } = criarFakes()
    perfis.criar.mockRejectedValue(new Error('Falha ao criar perfil (23505)'))

    await expect(service.cadastrar(cadastro)).rejects.toThrow(
      'Falha ao criar perfil',
    )

    expect(auth.apagarUsuario).toHaveBeenCalledWith('u-1')
    expect(auth.enviarCodigoDeConfirmacao).not.toHaveBeenCalled()
  })

  it('mantém o erro original se o desfazer também falhar', async () => {
    const { service, auth, perfis } = criarFakes()
    perfis.criar.mockRejectedValue(new Error('Falha ao criar perfil (x)'))
    auth.apagarUsuario.mockRejectedValue(new Error('fora do ar'))

    await expect(service.cadastrar(cadastro)).rejects.toThrow(
      'Falha ao criar perfil',
    )
  })

  it('e-mail já cadastrado responde igual a e-mail novo, sem criar perfil', async () => {
    const novo = criarFakes()
    const existente = criarFakes()
    existente.auth.criarUsuario.mockRejectedValue(
      new FalhaDoSupabaseAuth('email_existente', 'email_exists'),
    )

    const respostaNova = await novo.service.cadastrar(cadastro)
    const respostaExistente = await existente.service.cadastrar(cadastro)

    expect(respostaExistente).toEqual(respostaNova)
    expect(existente.perfis.criar).not.toHaveBeenCalled()
    expect(existente.auth.apagarUsuario).not.toHaveBeenCalled()
  })

  it('e-mail já cadastrado reenvia o código (cadastro abandonado)', async () => {
    const { service, auth } = criarFakes()
    auth.criarUsuario.mockRejectedValue(
      new FalhaDoSupabaseAuth('email_existente', 'email_exists'),
    )

    await service.cadastrar(cadastro)

    expect(auth.enviarCodigoDeConfirmacao).toHaveBeenCalledWith(
      'maria@exemplo.com',
    )
  })

  it('falha no envio do e-mail não muda a resposta nem desfaz a conta', async () => {
    const { service, auth } = criarFakes()
    auth.enviarCodigoDeConfirmacao.mockRejectedValue(
      new FalhaDoSupabaseAuth('limite_de_envio', 'over_email_send_rate_limit'),
    )

    const resposta = await service.cadastrar(cadastro)

    expect(resposta.mensagem).toBeTruthy()
    expect(auth.apagarUsuario).not.toHaveBeenCalled()
  })

  it('traduz senha fraca para erro de negócio', async () => {
    const { service, auth } = criarFakes()
    auth.criarUsuario.mockRejectedValue(
      new FalhaDoSupabaseAuth('senha_fraca', 'weak_password'),
    )

    await expect(service.cadastrar(cadastro)).rejects.toMatchObject({
      codigo: 'senha_fraca',
      status: 400,
    })
  })

  it('erro desconhecido do Supabase sobe como erro inesperado', async () => {
    const { service, auth } = criarFakes()
    auth.criarUsuario.mockRejectedValue(
      new FalhaDoSupabaseAuth('desconhecido', 'unexpected_failure'),
    )

    const promessa = service.cadastrar(cadastro)

    await expect(promessa).rejects.toBeInstanceOf(FalhaDoSupabaseAuth)
    await expect(promessa).rejects.not.toBeInstanceOf(ErroDeNegocio)
  })
})

describe('confirmarEmail', () => {
  const sessao = { accessToken: 'a', refreshToken: 'r', expiresIn: 3600 }
  const usuario = { id: 'u-1', email: 'maria@exemplo.com' }

  it('devolve sessão, usuário e perfil (sem is_admin)', async () => {
    const { service, auth, perfis } = criarFakes()
    auth.confirmarCodigo.mockResolvedValue({ usuario, sessao })
    perfis.buscarPorId.mockResolvedValue({
      id: 'u-1',
      nome: 'Maria',
      tipo: 'profissional',
      status: 'pendente',
      is_admin: false,
    })

    const resultado = await service.confirmarEmail({
      email: 'maria@exemplo.com',
      codigo: '123456',
    })

    expect(auth.confirmarCodigo).toHaveBeenCalledWith(
      'maria@exemplo.com',
      '123456',
    )
    expect(resultado.sessao).toEqual(sessao)
    expect(resultado.perfil).toEqual({
      nome: 'Maria',
      tipo: 'profissional',
      status: 'pendente',
    })
  })

  it('código inválido ou vencido vira erro 400 em português', async () => {
    const { service, auth } = criarFakes()
    auth.confirmarCodigo.mockRejectedValue(
      new FalhaDoSupabaseAuth('codigo_invalido', 'otp_expired'),
    )

    await expect(
      service.confirmarEmail({ email: 'maria@exemplo.com', codigo: '000000' }),
    ).rejects.toMatchObject({ codigo: 'codigo_invalido', status: 400 })
  })

  it('limite de tentativas vira erro 429', async () => {
    const { service, auth } = criarFakes()
    auth.confirmarCodigo.mockRejectedValue(
      new FalhaDoSupabaseAuth('limite_de_envio', 'over_request_rate_limit'),
    )

    await expect(
      service.confirmarEmail({ email: 'maria@exemplo.com', codigo: '000000' }),
    ).rejects.toMatchObject({ codigo: 'muitas_tentativas', status: 429 })
  })

  it('não abre sessão se a conta confirmada não tiver perfil', async () => {
    const { service, auth, perfis } = criarFakes()
    auth.confirmarCodigo.mockResolvedValue({ usuario, sessao })
    perfis.buscarPorId.mockResolvedValue(null)

    await expect(
      service.confirmarEmail({ email: 'maria@exemplo.com', codigo: '123456' }),
    ).rejects.toThrow('sem perfil')
  })
})

describe('reenviarCodigo', () => {
  it('envia o código e responde com a mensagem padrão', async () => {
    const { service, auth } = criarFakes()

    const resposta = await service.reenviarCodigo({
      email: 'maria@exemplo.com',
    })

    expect(auth.enviarCodigoDeConfirmacao).toHaveBeenCalledWith(
      'maria@exemplo.com',
    )
    expect(resposta.mensagem).toBeTruthy()
  })

  it('responde igual mesmo quando o Supabase recusa (limite ou conta inexistente)', async () => {
    const { service, auth } = criarFakes()
    const ok = await service.reenviarCodigo({ email: 'maria@exemplo.com' })
    auth.enviarCodigoDeConfirmacao.mockRejectedValue(
      new FalhaDoSupabaseAuth('limite_de_envio', 'over_email_send_rate_limit'),
    )

    const recusado = await service.reenviarCodigo({
      email: 'outra@exemplo.com',
    })

    expect(recusado).toEqual(ok)
  })
})
