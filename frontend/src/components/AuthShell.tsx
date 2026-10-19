import Link from 'next/link'
import { Logo } from './ui'

type Props = {
  title: string
  subtitle: string
  footerText: string
  footerLink: { href: string; label: string }
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, footerText, footerLink, children }: Props) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            Sua garagem, <span className="text-brand-500">organizada em segundos.</span>
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            Envie o CRLV e deixe a inteligência artificial preencher os dados do veículo para você.
          </p>
        </div>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} Drivo</p>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-600">
            {footerText}{' '}
            <Link href={footerLink.href} className="font-semibold text-brand-600 hover:underline">
              {footerLink.label}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
