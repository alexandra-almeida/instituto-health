// Dados NÃO secretos da clínica usados no frete. Endereço informado pela Alexandra
// em 19/11/2026; é o mesmo cadastrado na conta de produção do Melhor Envio.
export const ENDERECO_DA_CLINICA = {
  rua: 'Rua 15 de Novembro',
  numero: '464',
  bairro: 'Centro',
  cidade: 'Rincão',
  estado: 'SP',
  cep: '14830021',
} as const

// CEP de origem da cotação (e do remetente da etiqueta)
export const CEP_DE_ORIGEM = ENDERECO_DA_CLINICA.cep

// Texto da opção no checkout e o endereço mostrado na retirada
export const ROTULO_DA_OPCAO_DE_RETIRADA = 'Retirar na clínica (Rincão, SP)'
export const ENDERECO_DA_RETIRADA =
  'Rua 15 de Novembro, 464, Centro, Rincão, SP, CEP 14830-021'

// Remetente da etiqueta (etapa F7). O endereço já está certo; FALTAM razão social,
// CNPJ e inscrição estadual (a Alexandra manda depois, quando a Juliana
// responder), além do horário e do telefone da retirada. Enquanto não vierem, a
// etiqueta não é criada (a criação da etiqueta ainda não existe).
export const REMETENTE = {
  ...ENDERECO_DA_CLINICA,
  razaoSocial: null as string | null,
  cnpj: null as string | null,
  inscricaoEstadual: null as string | null,
}
