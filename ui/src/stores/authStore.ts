import { create } from 'zustand'
import { API, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants'
import { apiFetch } from '@/lib/api'

interface User {
  id: string
  email: string
  orgId?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch<{ token: string; userId: string; orgId?: string }>(
        `${API.GATEWAY}/auth/token`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      )
      const user: User = { id: data.userId, email, orgId: data.orgId }
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
      try {
        const user = JSON.parse(raw) as User
        set({ user, token })
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }
  },
}))
