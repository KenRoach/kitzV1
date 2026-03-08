import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/lib/i18n'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, signup, login, isLoading, error } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { t } = useTranslation()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'signup') {
        await signup(email, password, name)
      } else {
        await login(email, password)
      }
      navigate('/', { replace: true })
    } catch {
      // Error is set in store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
              KITZ
            </span>
          </h1>
          <p className="mt-2 text-sm text-purple-300/60">{t('auth.tagline')}</p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/20"
            />
          )}
          <input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/20"
          />
          <input
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/20"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {isLoading ? t('loading') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
          </button>
        </form>

        {/* Toggle login/signup */}
        <p className="text-center text-xs text-white/40">
          {mode === 'login' ? (
            <>
              {t('auth.noAccount')}{' '}
              <button onClick={() => setMode('signup')} className="text-purple-300 hover:underline">
                {t('auth.signUp')}
              </button>
            </>
          ) : (
            <>
              {t('auth.alreadyHaveAccount')}{' '}
              <button onClick={() => setMode('login')} className="text-purple-300 hover:underline">
                {t('auth.signIn')}
              </button>
            </>
          )}
        </p>

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-500/20 px-4 py-2 text-center text-xs text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
