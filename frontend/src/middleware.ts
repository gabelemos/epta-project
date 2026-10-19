import { NextResponse, type NextRequest } from 'next/server'
import { TOKEN_COOKIE } from '@/lib/auth'

const PUBLIC = ['/login', '/register']

// Proteção "de primeira linha": evita flash de conteúdo privado. A validação real do JWT é feita pela API.
export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has(TOKEN_COOKIE)
  const isPublic = PUBLIC.some((p) => req.nextUrl.pathname.startsWith(p))

  if (!hasToken && !isPublic) return NextResponse.redirect(new URL('/login', req.url))
  if (hasToken && isPublic) return NextResponse.redirect(new URL('/garage', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|favicon.ico|api).*)'] }
