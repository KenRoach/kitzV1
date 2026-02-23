import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    // Auto-login for MVP — skip password, go straight to WhatsApp QR
    if (!user) {
      useAuthStore.setState({
        user: { id: 'dev', email: 'kenneth@kitz.services' },
        token: 'dev-token',
      })
      localStorage.setItem('kitz_token', 'dev-token')
      localStorage.setItem('kitz_user', JSON.stringify({ id: 'dev', email: 'kenneth@kitz.services' }))
    }
    navigate('/connect-whatsapp', { replace: true })
  }, [user, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">
          <span className="bg-gradient-to-r from-[#00D4AA] to-[#00B4D8] bg-clip-text text-transparent">
            KITZ
          </span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
