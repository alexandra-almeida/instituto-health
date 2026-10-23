import { describe, expect, it } from 'vitest'
import {
  conferirAssinatura,
  EXTENSAO_DO_TIPO,
  TIPO_DA_EXTENSAO,
  TIPOS_ACEITOS,
} from '../src/modules/comprovantes/comprovantes.regras.js'

const bytes = (...valores: number[]) => Uint8Array.from(valores)
const ascii = (texto: string) =>
  Uint8Array.from(texto, (caractere) => caractere.charCodeAt(0))

describe('conferirAssinatura', () => {
  it('jpeg', () => {
    expect(
      conferirAssinatura('image/jpeg', bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10)),
    ).toBe(true)
    expect(conferirAssinatura('image/jpeg', bytes(0xff, 0xd8, 0x00))).toBe(
      false,
    )
  })

  it('png', () => {
    expect(
      conferirAssinatura(
        'image/png',
        bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0),
      ),
    ).toBe(true)
    expect(
      conferirAssinatura('image/png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d)),
    ).toBe(false)
  })

  it('pdf', () => {
    expect(conferirAssinatura('application/pdf', ascii('%PDF-1.7\n'))).toBe(
      true,
    )
    expect(conferirAssinatura('application/pdf', ascii('<html><body>'))).toBe(
      false,
    )
    expect(conferirAssinatura('application/pdf', ascii('%PDF'))).toBe(false)
  })

  it.each(['heic', 'heix', 'mif1', 'msf1', 'hevc'])(
    'heic com a marca %s',
    (marca) => {
      const arquivo = Uint8Array.from([
        0,
        0,
        0,
        0x18,
        ...ascii('ftyp'),
        ...ascii(marca),
      ])
      expect(conferirAssinatura('image/heic', arquivo)).toBe(true)
    },
  )

  it('heic recusa marca de outro formato (mp4) e arquivo sem ftyp', () => {
    const mp4 = Uint8Array.from([
      0,
      0,
      0,
      0x18,
      ...ascii('ftyp'),
      ...ascii('isom'),
    ])
    expect(conferirAssinatura('image/heic', mp4)).toBe(false)
    expect(conferirAssinatura('image/heic', ascii('GIF89a000000'))).toBe(false)
  })

  it('arquivo vazio ou curto demais nunca passa', () => {
    for (const tipo of TIPOS_ACEITOS) {
      expect(conferirAssinatura(tipo, new Uint8Array(0))).toBe(false)
    }
  })

  it('um formato não passa como outro (png rotulado como pdf)', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    expect(conferirAssinatura('application/pdf', png)).toBe(false)
    expect(conferirAssinatura('image/jpeg', png)).toBe(false)
  })
})

describe('tabelas de tipo e extensão', () => {
  it('são o inverso uma da outra', () => {
    for (const tipo of TIPOS_ACEITOS) {
      expect(TIPO_DA_EXTENSAO[EXTENSAO_DO_TIPO[tipo]]).toBe(tipo)
    }
  })
})
