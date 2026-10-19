'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthShell } from '@/components/AuthShell'
import { Alert, Button, Field } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'
import type { User } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      })
      setToken(token)
      router.replace('/garage')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para acessar sua garagem."
      footerText="Ainda não tem conta?"
      footerLink={{ href: '/register', label: 'Cadastre-se' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="E-mail" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </AuthShell>
  )
}
