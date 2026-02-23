import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRScanner } from '@/components/whatsapp/QRScanner'
import { Orb } from '@/components/orb/Orb'

export function WhatsAppPage() {
  const navigate = useNavigate()
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  const handleConnected = () => {
    redirectTimer.current = setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <Orb static />
      <p className="mt-4 mb-8 text-gray-500">Scan the QR to run Kitz in your WhatsApp</p>

      <QRScanner onConnected={handleConnected} />

      <button
        onClick={() => navigate('/')}
        className="mt-6 text-sm text-gray-400 transition hover:text-purple-500"
      >
        Skip to run it manually →
      </button>
    </div>
  )
}
