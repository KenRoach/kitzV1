import { create } from 'zustand'
import { API, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants'
import { apiFetch } from '@/lib/api'

interface User {
  id: string
  email: string
  orgId?: string
  name?: string
  picture?: string
  authProvider?: 'email' | 'google'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  signup: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (code: string) => Promise<void>
  getGoogleAuthUrl: () => Promise<string>
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
      const data = await apiFetch<{ token: string; userId: string; orgId?: string }>(
        `${API.GATEWAY}/auth/token`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      )
      const user: User = { id: data.userId, email, orgId: data.orgId, authProvider: 'email' }
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

  loginWithGoogle: async (code) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch<{ token: string; userId: string; orgId?: string; name?: string; picture?: string }>(
        `${API.GATEWAY}/auth/google/callback`,
        {
          method: 'POST',
          body: JSON.stringify({ code }),
        },
      )
      const user: User = {
        id: data.userId,
        email: '',
        orgId: data.orgId,
        name: data.name,
        picture: data.picture,
        authProvider: 'google',
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      set({ user, token: data.token, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Google login failed',
        isLoading: false,
      })
      throw err
    }
  },

  getGoogleAuthUrl: async () => {
    const data = await apiFetch<{ url: string }>(
      `${API.GATEWAY}/auth/google/url`,
    )
    return data.url
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
          return
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        return
      }
      try {
        const user = JSON.parse(raw) as User
        set({ user, token })
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    // Listen for auth expiry events from apiFetch
    window.addEventListener('kitz:auth-expired', () => {
      set({ user: null, token: null, error: 'Session expired — please log in again.' })
    })
  },
}))
