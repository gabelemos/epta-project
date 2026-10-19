'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VehicleForm } from '@/components/VehicleForm'
import { Alert, Spinner } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { vehicleToForm } from '@/lib/format'
import type { Vehicle } from '@/lib/types'

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Vehicle>(`/vehicles/${id}`)
      .then(setVehicle)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar veículo'))
  }, [id])

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/garage" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Voltar para a garagem
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Editar veículo</h1>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {error && <Alert>{error}</Alert>}
        {!error && !vehicle && (
          <div className="flex justify-center py-12 text-brand-600" aria-busy="true">
            <Spinner />
          </div>
        )}
        {vehicle && (
          <VehicleForm
            initial={vehicleToForm(vehicle)}
            submitLabel="Salvar alterações"
            onSubmit={async (values) => {
              await api(`/vehicles/${id}`, { method: 'PUT', body: values })
              router.push('/garage')
              router.refresh()
            }}
          />
        )}
      </div>
    </div>
  )
}
