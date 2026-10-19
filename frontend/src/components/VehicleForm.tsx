'use client'

import { useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { emptyVehicleForm, mergeCrlv, normalizePlate } from '@/lib/format'
import type { VehicleFormValues } from '@/lib/types'
import { Alert, Button, Field } from './ui'

type Props = {
  initial?: VehicleFormValues
  submitLabel: string
  allowCrlvImport?: boolean
  onSubmit: (values: VehicleFormValues) => Promise<void>
}

export function VehicleForm({ initial = emptyVehicleForm, submitLabel, allowCrlvImport = false, onSubmit }: Props) {
  const [values, setValues] = useState<VehicleFormValues>(initial)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const set = (key: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'plate' ? normalizePlate(e.target.value) : key === 'state' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value
    setValues((v) => ({ ...v, [key]: value }))
    setFieldErrors((errs) => ({ ...errs, [key]: '' }))
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setScanning(true)
    setError(null)
    setScanInfo(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api<{ data: Record<string, string | number | null> }>('/crlv/scan', {
        method: 'POST',
        formData,
      })
      const filled = Object.values(data).filter((v) => v !== null && v !== '').length
      if (filled === 0) {
        setError('Não encontramos dados de CRLV nesse arquivo. Tente uma imagem mais nítida ou preencha manualmente.')
      } else {
        setValues((current) => mergeCrlv(current, data))
        setScanInfo(`${filled} campos preenchidos automaticamente. Revise os dados antes de salvar.`)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao ler o CRLV')
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      await onSubmit(values)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(Object.fromEntries(err.issues.map((i) => [i.field, i.message])))
      } else {
        setError('Erro inesperado ao salvar')
      }
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {allowCrlvImport && (
        <section className="rounded-2xl border-2 border-dashed border-brand-500/50 bg-brand-50 p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-brand-700">Importar CRLV com IA</h2>
              <p className="text-sm text-slate-600">Envie o PDF ou foto do documento e preenchemos o formulário para você.</p>
            </div>
            <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
            <Button type="button" onClick={() => fileInput.current?.click()} loading={scanning}>
              {scanning ? 'Lendo documento…' : 'Enviar CRLV'}
            </Button>
          </div>
          {scanInfo && (
            <div className="mt-4">
              <Alert tone="info">{scanInfo}</Alert>
            </div>
          )}
        </section>
      )}

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Placa *" name="plate" value={values.plate} onChange={set('plate')} error={fieldErrors.plate} placeholder="ABC1D23" />
        <Field label="RENAVAM" name="renavam" value={values.renavam} onChange={set('renavam')} error={fieldErrors.renavam} inputMode="numeric" />
        <Field label="Marca *" name="brand" value={values.brand} onChange={set('brand')} error={fieldErrors.brand} />
        <Field label="Modelo *" name="model" value={values.model} onChange={set('model')} error={fieldErrors.model} />
        <Field label="Ano de fabricação" name="manufactureYear" value={values.manufactureYear} onChange={set('manufactureYear')} error={fieldErrors.manufactureYear} inputMode="numeric" maxLength={4} />
        <Field label="Ano do modelo" name="modelYear" value={values.modelYear} onChange={set('modelYear')} error={fieldErrors.modelYear} inputMode="numeric" maxLength={4} />
        <Field label="Cor" name="color" value={values.color} onChange={set('color')} error={fieldErrors.color} />
        <Field label="Combustível" name="fuel" value={values.fuel} onChange={set('fuel')} error={fieldErrors.fuel} />
        <Field label="Chassi" name="chassis" value={values.chassis} onChange={set('chassis')} error={fieldErrors.chassis} maxLength={17} className="sm:col-span-2" />
        <Field label="Proprietário" name="ownerName" value={values.ownerName} onChange={set('ownerName')} error={fieldErrors.ownerName} className="sm:col-span-2" />
        <Field label="Cidade" name="city" value={values.city} onChange={set('city')} error={fieldErrors.city} />
        <Field label="UF" name="state" value={values.state} onChange={set('state')} error={fieldErrors.state} maxLength={2} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
