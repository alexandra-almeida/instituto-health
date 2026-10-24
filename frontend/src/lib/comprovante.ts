// Regras do arquivo do comprovante profissional no navegador. O backend confere
// tudo de novo (tipo, tamanho e o conteúdo do arquivo); isto só evita uma ida
// ao servidor com um arquivo que já se sabe inválido e dá a mensagem na hora.
//
// HEIC não é aceito (decisão de 24/10/2026): com o campo de arquivo listando só
// JPEG, PNG e PDF, o iPhone converte a foto para JPEG sozinho ao escolher.

export const TAMANHO_MAXIMO_COMPROVANTE = 10 * 1024 * 1024

export type TipoDeComprovante = 'image/jpeg' | 'image/png' | 'application/pdf'

const TIPOS_ACEITOS: TipoDeComprovante[] = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]

// Alguns navegadores deixam o tipo vazio; nesse caso vale a extensão
const TIPO_POR_EXTENSAO: Record<string, TipoDeComprovante> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
}

// Devolve o tipo que o backend aceita, ou null se o arquivo não é de um dos
// formatos permitidos (JPG, PNG ou PDF)
export function tipoDoComprovante(arquivo: {
  name: string
  type: string
}): TipoDeComprovante | null {
  const declarado = arquivo.type.toLowerCase()
  const aceito = TIPOS_ACEITOS.find((tipo) => tipo === declarado)
  if (aceito) return aceito

  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
  return TIPO_POR_EXTENSAO[extensao] ?? null
}
