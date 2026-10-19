'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthShell } from '@/components/AuthShell'
import { Alert, Button, Field } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'
import type { User } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const { token } = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: form,
        auth: false,
      })
      setToken(token)
      router.replace('/garage')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(Object.fromEntries(err.issues.map((i) => [i.field, i.message])))
      } else {
        setError('Erro inesperado')
      }
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Comece a montar sua garagem."
      footerText="Já tem conta?"
      footerLink={{ href: '/login', label: 'Entrar' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label="Nome" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={fieldErrors.name} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={fieldErrors.email} />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={fieldErrors.password} />
        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>
    </AuthShell>
  )
}
