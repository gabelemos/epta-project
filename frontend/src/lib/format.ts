import type { Vehicle, VehicleFormValues } from './types'

/** Remove símbolos, põe em maiúsculas e limita a 7 caracteres (ABC1234 / ABC1D23). */
export function normalizePlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)
}

/** Exibe a placa no formato antigo com hífen (ABC-1234); Mercosul fica sem hífen. */
export function formatPlate(plate: string) {
  return /^[A-Z]{3}\d{4}$/.test(plate) ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate
}

export const emptyVehicleForm: VehicleFormValues = {
  plate: '',
  renavam: '',
  chassis: '',
  brand: '',
  model: '',
  manufactureYear: '',
  modelYear: '',
  color: '',
  fuel: '',
  ownerName: '',
  city: '',
  state: '',
}

export function vehicleToForm(v: Vehicle): VehicleFormValues {
  return {
    plate: v.plate,
    renavam: v.renavam ?? '',
    chassis: v.chassis ?? '',
    brand: v.brand,
    model: v.model,
    manufactureYear: v.manufactureYear?.toString() ?? '',
    modelYear: v.modelYear?.toString() ?? '',
    color: v.color ?? '',
    fuel: v.fuel ?? '',
    ownerName: v.ownerName ?? '',
    city: v.city ?? '',
    state: v.state ?? '',
  }
}

/** Mescla os dados lidos do CRLV no formulário, sem apagar o que o usuário já digitou quando o scan não achou o campo. */
export function mergeCrlv(current: VehicleFormValues, scanned: Record<string, string | number | null>): VehicleFormValues {
  const next = { ...current }
  for (const key of Object.keys(current) as (keyof VehicleFormValues)[]) {
    const value = scanned[key]
    if (value !== null && value !== undefined && value !== '') next[key] = String(value)
  }
  return next
}
