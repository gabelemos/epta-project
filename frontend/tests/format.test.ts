import { describe, expect, it } from 'vitest'
import { emptyVehicleForm, formatPlate, mergeCrlv, normalizePlate } from '../src/lib/format'

describe('format', () => {
  it('normalizePlate limpa e limita', () => {
    expect(normalizePlate('abc-1d23xx')).toBe('ABC1D23')
  })

  it('formatPlate usa hífen apenas na placa antiga', () => {
    expect(formatPlate('ABC1234')).toBe('ABC-1234')
    expect(formatPlate('ABC1D23')).toBe('ABC1D23')
  })

  it('mergeCrlv preenche campos lidos e preserva os demais', () => {
    const base = { ...emptyVehicleForm, color: 'Preto' }
    const merged = mergeCrlv(base, { plate: 'ABC1D23', brand: 'FIAT', color: null, modelYear: 2021 })
    expect(merged.plate).toBe('ABC1D23')
    expect(merged.brand).toBe('FIAT')
    expect(merged.modelYear).toBe('2021')
    expect(merged.color).toBe('Preto')
  })
})
