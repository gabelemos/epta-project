import { describe, expect, it } from 'vitest'
import { normalizePlate, vehicleInputSchema } from '../src/modules/vehicles/vehicles.schemas.js'

describe('vehicleInputSchema', () => {
  const base = { plate: 'abc-1234', brand: 'Fiat', model: 'Uno' }

  it('aceita placa antiga e normaliza', () => {
    const parsed = vehicleInputSchema.parse(base)
    expect(parsed.plate).toBe('ABC1234')
    expect(parsed.renavam).toBeNull()
  })

  it('aceita placa Mercosul', () => {
    expect(vehicleInputSchema.parse({ ...base, plate: 'BRA2E19' }).plate).toBe('BRA2E19')
  })

  it('rejeita placa inválida e marca vazia', () => {
    expect(vehicleInputSchema.safeParse({ ...base, plate: '123' }).success).toBe(false)
    expect(vehicleInputSchema.safeParse({ ...base, brand: '  ' }).success).toBe(false)
  })

  it('converte anos vindos de formulário e vazio em null', () => {
    const parsed = vehicleInputSchema.parse({ ...base, manufactureYear: '2018', modelYear: '' })
    expect(parsed.manufactureYear).toBe(2018)
    expect(parsed.modelYear).toBeNull()
  })

  it('normalizePlate remove símbolos', () => {
    expect(normalizePlate('abc 1d-23')).toBe('ABC1D23')
  })
})
