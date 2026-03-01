import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './constants'
import { generateTraceId } from './utils'

/** Check if a JWT is expired (with 60s buffer) */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
    return payload.exp ? payload.exp * 1000 < Date.now() - 60_000 : false
  } catch {
    return true
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const headers = new Headers(options.headers)

  // Check token expiry before making the request
  if (token && isTokenExpired(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    window.dispatchEvent(new CustomEvent('kitz:auth-expired'))
    throw new Error('Session expired — please log in again.')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('x-dev-secret', import.meta.env.VITE_SERVICE_SECRET || '')
  headers.set('x-trace-id', generateTraceId())
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // AI calls can take 30-60s through the semantic router — use 2min timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  let res: Response
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — KITZ is still thinking. Try again.')
    }
    throw new Error('Could not reach KITZ backend. Is the server running?')
  }
  clearTimeout(timeoutId)

  // Handle 401 — clear auth and notify
  if (res.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    window.dispatchEvent(new CustomEvent('kitz:auth-expired'))
    throw new Error('Session expired — please log in again.')
  }

  if (!res.ok) {
    const body = await res.text()
    let message = `API ${res.status}: ${body}`
    try {
      const parsed = JSON.parse(body)
      if (parsed.message) message = parsed.message
    } catch { /* use raw body */ }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}
