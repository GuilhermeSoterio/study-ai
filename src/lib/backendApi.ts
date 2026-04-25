import { supabase } from './supabase'

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8080'

// Token cacheado — atualizado pelo onAuthStateChange em App.tsx antes de qualquer chamada
let _token: string | null = null

export function setBackendToken(token: string | null) {
  _token = token
}

async function getToken(): Promise<string> {
  if (_token) return _token
  // Fallback para chamadas fora do fluxo de auth (ex: refresh de página)
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status} — ${path}`)
  }
  return res.json()
}

export const backendApi = {
  get:   <T>(path: string)               => request<T>(path),
  post:  <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:   <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  del:   <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
}
