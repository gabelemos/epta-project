'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { User } from '@/lib/types'

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api<User>('/me')
      .then((u) => setForm((f) => ({ ...f, name: u.name, email: u.email })))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    setFieldErrors({})
    try {
      const body: Record<string, string> = { name: form.name, email: form.email }
      if (form.newPassword) {
        body.currentPassword = form.currentPassword
        body.newPassword = form.newPassword
      }
      await api<User>('/me', { method: 'PATCH', body })
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }))
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(Object.fromEntries(err.issues.map((i) => [i.field, i.message])))
      } else {
        setError('Erro inesperado')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold text-ink">Meu perfil</h1>
      <p className="text-sm text-slate-600">Atualize seus dados cadastrais.</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="flex justify-center py-12 text-brand-600" aria-busy="true">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <Alert>{error}</Alert>}
            {success && <Alert tone="info">Dados atualizados com sucesso.</Alert>}
            <Field label="Nome" name="name" value={form.name} onChange={set('name')} error={fieldErrors.name} />
            <Field label="E-mail" name="email" type="email" value={form.email} onChange={set('email')} error={fieldErrors.email} />

            <fieldset className="space-y-4 border-t border-slate-100 pt-4">
              <legend className="text-sm font-semibold text-slate-700">Alterar senha (opcional)</legend>
              <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={fieldErrors.currentPassword} />
              <Field label="Nova senha" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={fieldErrors.newPassword} />
            </fieldset>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Salvar alterações
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
