import { AUTH_TOKEN_KEY } from './constants'
import { generateTraceId } from './utils'

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('x-dev-secret', import.meta.env.VITE_SERVICE_SECRET || 'dev-secret-change-me')
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

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}
