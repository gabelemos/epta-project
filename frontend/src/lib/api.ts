import { clearToken, getToken } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: { field: string; message: string }[] = [],
  ) {
    super(message)
  }
  /** Mensagem de um campo específico vinda da validação da API. */
  fieldError(field: string) {
    return this.issues.find((i) => i.field === field)?.message
  }
}

type Options = { method?: string; body?: unknown; formData?: FormData; auth?: boolean }

export async function api<T>(path: string, { method = 'GET', body, formData, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
  }

  if (res.status === 401 && auth) {
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Erro inesperado', data?.issues ?? [])
  return data as T
}
