import { supabaseAdmin } from '../lib/supabase.js'

const BUCKET = 'comprovantes-profissionais'
const TABELA = 'comprovantes_profissionais'

export interface ComprovanteRegistrado {
  id: string
  enviadoEm: string
}

export interface InfoDoArquivo {
  tamanho: number
  tipo: string
}

export interface ComprovantesRepository {
  contarRegistros(perfilId: string): Promise<number>
  listarPorPerfil(perfilId: string): Promise<ComprovanteRegistrado[]>
  buscarPorCaminho(caminho: string): Promise<ComprovanteRegistrado | null>
  inserir(perfilId: string, caminho: string): Promise<ComprovanteRegistrado>
  contarArquivosNaPasta(perfilId: string): Promise<number>
  criarUrlDeEnvio(caminho: string): Promise<string>
  obterInfo(caminho: string): Promise<InfoDoArquivo | null>
  lerPrimeirosBytes(caminho: string, quantidade: number): Promise<Uint8Array>
  removerArquivo(caminho: string): Promise<void>
}

interface Linha {
  id: string
  enviado_em: string
}

const paraRegistro = (linha: Linha): ComprovanteRegistrado => ({
  id: linha.id,
  enviadoEm: linha.enviado_em,
})

// Única camada que lê e grava a tabela `comprovantes_profissionais` e o bucket
// `comprovantes-profissionais`. As mensagens de erro levam só o código: o
// detalhe do Supabase pode conter caminho de arquivo ou URL assinada, que é
// credencial e nunca vai para log.
export const comprovantesRepository: ComprovantesRepository = {
  async contarRegistros(perfilId) {
    const { count, error } = await supabaseAdmin
      .from(TABELA)
      .select('id', { count: 'exact', head: true })
      .eq('perfil_id', perfilId)
    if (error) throw new Error(`Falha ao contar comprovantes (${error.code})`)
    return count ?? 0
  },

  async listarPorPerfil(perfilId) {
    const { data, error } = await supabaseAdmin
      .from(TABELA)
      .select('id, enviado_em')
      .eq('perfil_id', perfilId)
      .order('enviado_em', { ascending: false })
    if (error) throw new Error(`Falha ao listar comprovantes (${error.code})`)
    return (data as Linha[]).map(paraRegistro)
  },

  async buscarPorCaminho(caminho) {
    const { data, error } = await supabaseAdmin
      .from(TABELA)
      .select('id, enviado_em')
      .eq('storage_path', caminho)
      .maybeSingle()
    if (error) throw new Error(`Falha ao buscar comprovante (${error.code})`)
    return data ? paraRegistro(data as Linha) : null
  },

  async inserir(perfilId, caminho) {
    const { data, error } = await supabaseAdmin
      .from(TABELA)
      .insert({ perfil_id: perfilId, storage_path: caminho })
      .select('id, enviado_em')
      .single()
    if (error) {
      // 23505 = storage_path já registrado (duas confirmações ao mesmo
      // tempo): devolve o registro que já existe
      if (error.code === '23505') {
        const existente = await this.buscarPorCaminho(caminho)
        if (existente) return existente
      }
      throw new Error(`Falha ao registrar comprovante (${error.code})`)
    }
    return paraRegistro(data as Linha)
  },

  async contarArquivosNaPasta(perfilId) {
    // Basta saber se chegou ao limite; 100 é o teto de uma página
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(perfilId, { limit: 100 })
    if (error) throw new Error('Falha ao listar a pasta de comprovantes')
    return data.length
  },

  async criarUrlDeEnvio(caminho) {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(caminho)
    if (error) throw new Error('Falha ao criar a URL de envio do comprovante')
    return data.signedUrl
  },

  async obterInfo(caminho) {
    const bucket = supabaseAdmin.storage.from(BUCKET)
    const existe = await bucket.exists(caminho)
    if (existe.error) throw new Error('Falha ao consultar o comprovante')
    if (!existe.data) return null

    const { data, error } = await bucket.info(caminho)
    if (error) throw new Error('Falha ao ler os dados do comprovante')
    return { tamanho: data.size ?? 0, tipo: data.contentType ?? '' }
  },

  async lerPrimeirosBytes(caminho, quantidade) {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(caminho, 60)
    if (error) throw new Error('Falha ao ler o começo do comprovante')

    // Pede só o começo do arquivo; se o servidor ignorar o Range e mandar
    // tudo, o corpo é cortado assim que chegam os bytes necessários
    const resposta = await fetch(data.signedUrl, {
      headers: { Range: `bytes=0-${quantidade - 1}` },
    })
    if (!resposta.ok || !resposta.body) {
      throw new Error(
        `Falha ao ler o começo do comprovante (${resposta.status})`,
      )
    }
    const leitor = resposta.body.getReader()
    const bytes = new Uint8Array(quantidade)
    let lidos = 0
    while (lidos < quantidade) {
      const { done, value } = await leitor.read()
      if (done) break
      const pedaco = value.slice(0, quantidade - lidos)
      bytes.set(pedaco, lidos)
      lidos += pedaco.length
    }
    await leitor.cancel()
    return bytes.slice(0, lidos)
  },

  async removerArquivo(caminho) {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([caminho])
    if (error) throw new Error('Falha ao remover o comprovante')
  },
}
