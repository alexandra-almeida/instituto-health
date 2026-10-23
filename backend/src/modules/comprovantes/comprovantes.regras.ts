// Regras fixas dos comprovantes profissionais (plano, seção 6). O bucket
// `comprovantes-profissionais` tem os mesmos limites; aqui o backend confere
// de novo porque o bucket só olha o Content-Type que o navegador declarou.

export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

// No máximo 5 comprovantes registrados por pessoa e 10 arquivos na pasta dela
// (registrados mais enviados que nunca foram confirmados), para uma conta não
// encher o Storage pedindo URLs sem parar
export const LIMITE_DE_REGISTRADOS = 5
export const LIMITE_DE_ARQUIVOS_NA_PASTA = 10

export const TIPOS_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf',
] as const

export type TipoDeComprovante = (typeof TIPOS_ACEITOS)[number]

// A extensão do arquivo no bucket sai SEMPRE daqui, nunca do nome que o
// navegador enviou
export const EXTENSAO_DO_TIPO: Record<TipoDeComprovante, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
}

export const TIPO_DA_EXTENSAO: Record<string, TipoDeComprovante> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  pdf: 'application/pdf',
}

// Quantos bytes do começo do arquivo bastam para reconhecer qualquer um dos
// formatos acima
export const BYTES_DA_ASSINATURA = 16

const comecaCom = (bytes: Uint8Array, esperado: number[], deslocamento = 0) =>
  esperado.every((byte, i) => bytes[deslocamento + i] === byte)

const texto = (bytes: Uint8Array, inicio: number, fim: number) =>
  String.fromCharCode(...bytes.slice(inicio, fim))

// Marcas de arquivo HEIC/HEIF (bytes 8 a 12, logo depois de "ftyp")
const MARCAS_HEIC = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevx',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
])

// Confere se o começo do arquivo é mesmo do tipo declarado: um HTML ou um
// executável rotulado como PDF não passa.
export function conferirAssinatura(
  tipo: TipoDeComprovante,
  bytes: Uint8Array,
): boolean {
  switch (tipo) {
    case 'image/jpeg':
      return comecaCom(bytes, [0xff, 0xd8, 0xff])
    case 'image/png':
      return comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'application/pdf':
      return texto(bytes, 0, 5) === '%PDF-'
    case 'image/heic':
      return (
        texto(bytes, 4, 8) === 'ftyp' && MARCAS_HEIC.has(texto(bytes, 8, 12))
      )
  }
}
