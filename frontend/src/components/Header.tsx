'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken } from '@/lib/auth'
import { Logo } from './ui'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const logout = () => {
    clearToken()
    router.replace('/login')
    router.refresh()
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        pathname.startsWith(href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/garage" aria-label="Ir para a garagem">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {link('/garage', 'Garagem')}
          {link('/profile', 'Perfil')}
          <button
            onClick={logout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
