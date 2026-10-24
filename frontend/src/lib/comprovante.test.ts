import { describe, expect, it } from 'vitest'
import { tipoDoComprovante } from './comprovante'

describe('tipoDoComprovante', () => {
  it.each([
    ['diploma.pdf', 'application/pdf', 'application/pdf'],
    ['foto.jpg', 'image/jpeg', 'image/jpeg'],
    ['foto.png', 'image/png', 'image/png'],
    // sem tipo informado pelo navegador: vale a extensão
    ['foto.jpeg', '', 'image/jpeg'],
    ['scan.PDF', '', 'application/pdf'],
    ['foto.jpg', 'application/octet-stream', 'image/jpeg'],
  ])('%s com tipo "%s" vira %s', (name, type, esperado) => {
    expect(tipoDoComprovante({ name, type })).toBe(esperado)
  })

  it.each([
    ['planilha.xlsx', 'application/vnd.ms-excel'],
    ['programa.exe', 'application/x-msdownload'],
    ['pagina.html', 'text/html'],
    ['animacao.gif', 'image/gif'],
    // HEIC não é aceito: o iPhone converte para JPEG ao escolher a foto
    ['foto.heic', 'image/heic'],
    ['foto.heif', 'image/heif'],
    ['IMG_0001.HEIC', ''],
    ['sem-extensao', ''],
    ['', ''],
  ])('%s com tipo "%s" não é aceito', (name, type) => {
    expect(tipoDoComprovante({ name, type })).toBeNull()
  })

  it('o tipo declarado vale mais que a extensão', () => {
    // um PNG com nome .pdf continua sendo tratado como PNG; quem confere o
    // conteúdo de verdade é o backend
    expect(tipoDoComprovante({ name: 'x.pdf', type: 'image/png' })).toBe(
      'image/png',
    )
  })
})
