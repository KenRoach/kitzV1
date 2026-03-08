import { create } from 'zustand'
import { API, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants'
import { apiFetch } from '@/lib/api'

interface User {
  id: string
  email: string
  orgId?: string
  name?: string
  picture?: string
  authProvider?: 'email' | 'google' | 'guest'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  signup: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch<{ token: string; userId: string; orgId?: string; name?: string }>(
        `${API.GATEWAY}/auth/signup`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        },
      )
      const user: User = { id: data.userId, email, orgId: data.orgId, name: data.name || name, authProvider: 'email' }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      set({ user, token: data.token, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Signup failed',
        isLoading: false,
      })
      throw err
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch<{ token: string; userId: string; orgId?: string; name?: string }>(
        `${API.GATEWAY}/auth/token`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      )
      const user: User = { id: data.userId, email, orgId: data.orgId, name: data.name, authProvider: 'email' }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      set({ user, token: data.token, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    set({ user: null, token: null })
  },

  hydrate: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (token && raw) {
      // Check token expiry
      try {
        const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
          // Token expired — auto-provision a new guest below
        } else {
          const user = JSON.parse(raw) as User
          set({ user, token })
          return // Valid session exists, done
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    // No valid session — auto-provision a guest account
    const guestId = crypto.randomUUID().slice(0, 8)
    const guestEmail = `guest-${guestId}@kitz.services`
    const guestPassword = `KitzGuest-${crypto.randomUUID()}`

    apiFetch<{ token: string; userId: string; orgId?: string; name?: string }>(
      `${API.GATEWAY}/auth/signup`,
      {
        method: 'POST',
        body: JSON.stringify({ email: guestEmail, password: guestPassword, name: 'Guest' }),
        skipAuthRedirect: true,
      },
    ).then((data) => {
      const user: User = { id: data.userId, email: guestEmail, orgId: data.orgId, name: 'Guest', authProvider: 'guest' }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      set({ user, token: data.token })
    }).catch(() => {
      // If signup fails (e.g. backend unreachable), set a minimal guest user
      // so the UI renders — API calls will fail gracefully
      const fallbackUser: User = { id: guestId, email: guestEmail, name: 'Guest', authProvider: 'guest' }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser))
      set({ user: fallbackUser, token: null })
    })

  },
}))

// Listen for auth expiry events from apiFetch — module-scoped, added once (prevents listener leak)
window.addEventListener('kitz:auth-expired', () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  useAuthStore.setState({ user: null, token: null })
  useAuthStore.getState().hydrate()
})
