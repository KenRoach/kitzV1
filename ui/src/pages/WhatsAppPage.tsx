import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRScanner } from '@/components/whatsapp/QRScanner'

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
      <h1 className="text-3xl font-extrabold">
        <span className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
          KITZ
        </span>
      </h1>
      <p className="mt-2 text-gray-500">Connect your WhatsApp to get started</p>
      <p className="mb-8 text-xs text-gray-400">
        Scan the QR code with your WhatsApp to link your business
      </p>

      <QRScanner onConnected={handleConnected} />

      <button
        onClick={() => navigate('/')}
        className="mt-6 text-sm text-gray-400 transition hover:text-purple-500"
      >
        Skip for now →
      </button>
    </div>
  )
}
