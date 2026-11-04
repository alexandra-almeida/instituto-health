import { describe, expect, it } from 'vitest'
import { PROMO_ESQUENTA_BLACK_SEMANA_1 } from '../data/promocoes'
import { findProductById } from '../data/tulipiaProducts'

describe('PROMO_ESQUENTA_BLACK_SEMANA_1', () => {
  const { skus } = PROMO_ESQUENTA_BLACK_SEMANA_1

  it('tem os 16 produtos da semana 1', () => {
    expect(skus).toHaveLength(16)
  })

  it('não repete sku', () => {
    expect(new Set(skus).size).toBe(skus.length)
  })

  it.each(PROMO_ESQUENTA_BLACK_SEMANA_1.skus)(
    'o sku %s existe no catálogo',
    (sku) => {
      expect(findProductById(sku)).toBeDefined()
    },
  )
})
