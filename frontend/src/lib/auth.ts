export const TOKEN_COOKIE = 'drivo_token'

const SEVEN_DAYS = 60 * 60 * 24 * 7

export function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${TOKEN_COOKIE}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

export function setToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${SEVEN_DAYS}; SameSite=Lax`
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
