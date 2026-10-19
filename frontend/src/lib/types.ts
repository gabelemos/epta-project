export type User = { id: string; name: string; email: string }

export type Vehicle = {
  id: string
  plate: string
  renavam: string | null
  chassis: string | null
  brand: string
  model: string
  manufactureYear: number | null
  modelYear: number | null
  color: string | null
  fuel: string | null
  ownerName: string | null
  city: string | null
  state: string | null
}

export type VehiclePage = { items: Vehicle[]; total: number; page: number; pageSize: number }

export type VehicleFormValues = {
  plate: string
  renavam: string
  chassis: string
  brand: string
  model: string
  manufactureYear: string
  modelYear: string
  color: string
  fuel: string
  ownerName: string
  city: string
  state: string
}
