import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/lib/i18n'
import { API } from '@/lib/constants'
import { apiFetch } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, signup, login, isLoading, error, loginWithToken } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'signup' | 'whatsapp'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+507')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkError, setMagicLinkError] = useState('')
  const [sending, setSending] = useState(false)
  const { t } = useTranslation()

  // Handle magic-link token from URL redirect
  useEffect(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')
    const orgId = searchParams.get('orgId')
    const userName = searchParams.get('name')
    if (token && userId) {
      loginWithToken(token, { id: userId, email: '', orgId: orgId || '', name: userName || '', authProvider: 'email' })
      navigate('/', { replace: true })
    }
  }, [searchParams, loginWithToken, navigate])

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

  const handleWhatsAppLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMagicLinkError('')
    setSending(true)
    try {
      await apiFetch(`${API.GATEWAY}/auth/magic-link`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
        skipAuthRedirect: true,
      })
      setMagicLinkSent(true)
    } catch (err) {
      setMagicLinkError(err instanceof Error ? err.message : t('auth.magicLinkError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
              KitZ (OS)
            </span>
          </h1>
          <p className="mt-2 text-sm text-purple-300/60">{t('auth.tagline')}</p>
        </div>

        {/* WhatsApp Login (Primary) */}
        {mode === 'whatsapp' && !magicLinkSent && (
          <form onSubmit={handleWhatsAppLogin} className="space-y-4">
            <div className="text-center text-sm text-white/60 mb-2">
              {t('auth.whatsappDesc')}
            </div>
            <input
              type="tel"
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {sending ? t('loading') : t('auth.sendMagicLink')}
            </button>
          </form>
        )}

        {/* Magic Link Sent Confirmation */}
        {mode === 'whatsapp' && magicLinkSent && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-white/80">{t('auth.magicLinkSent')}</p>
            <p className="text-xs text-white/40">{t('auth.magicLinkExpiry')}</p>
            <button
              onClick={() => { setMagicLinkSent(false); setPhone('+507'); }}
              className="text-xs text-purple-300 hover:underline"
            >
              {t('auth.tryAgain')}
            </button>
          </div>
        )}

        {/* Email/Password Form */}
        {mode !== 'whatsapp' && (
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
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-purple-950 px-3 text-white/30">{t('auth.or')}</span>
          </div>
        </div>

        {/* Toggle WhatsApp / Email */}
        {mode === 'whatsapp' ? (
          <button
            onClick={() => { setMode('login'); setMagicLinkSent(false); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            {t('auth.useEmail')}
          </button>
        ) : (
          <button
            onClick={() => setMode('whatsapp')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-sm text-green-300 transition hover:bg-green-500/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t('auth.loginWhatsApp')}
          </button>
        )}

        {/* Toggle login/signup (only for email mode) */}
        {mode !== 'whatsapp' && (
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
        )}

        {/* Error display */}
        {(error || magicLinkError) && (
          <div className="rounded-lg bg-red-500/20 px-4 py-2 text-center text-xs text-red-300">
            {error || magicLinkError}
          </div>
        )}
      </div>
    </div>
  )
}
