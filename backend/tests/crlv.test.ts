import { describe, expect, it } from 'vitest'
import { normalizeCrlv } from '../src/modules/crlv/gemini.service.js'

describe('normalizeCrlv', () => {
  it('normaliza placa, renavam, chassi e UF', () => {
    const result = normalizeCrlv({
      plate: 'abc-1d23',
      renavam: '0123.456.789-0',
      chassis: '9bw zzz377vt004251',
      brand: ' VOLKSWAGEN ',
      model: 'GOL 1.0',
      manufactureYear: '2019',
      modelYear: 2020,
      state: 'pe-extra',
    })

    expect(result.plate).toBe('ABC1D23')
    expect(result.renavam).toBe('01234567890')
    expect(result.chassis).toBe('9BWZZZ377VT004251')
    expect(result.brand).toBe('VOLKSWAGEN')
    expect(result.manufactureYear).toBe(2019)
    expect(result.modelYear).toBe(2020)
    expect(result.state).toBe('PE')
  })

  it('transforma vazio, "null" e anos absurdos em null', () => {
    const result = normalizeCrlv({ plate: '', brand: 'null', manufactureYear: 12, color: undefined })
    expect(result).toMatchObject({ plate: null, brand: null, manufactureYear: null, color: null })
  })
})
