'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { VehicleForm } from '@/components/VehicleForm'
import { api } from '@/lib/api'

export default function NewVehiclePage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/garage" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Voltar para a garagem
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Novo veículo</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <VehicleForm
          allowCrlvImport
          submitLabel="Salvar veículo"
          onSubmit={async (values) => {
            await api('/vehicles', { method: 'POST', body: values })
            router.push('/garage')
            router.refresh()
          }}
        />
      </div>
    </div>
  )
}
