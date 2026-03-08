import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRScanner } from '@/components/whatsapp/QRScanner'
import { useTranslation } from '@/lib/i18n'

export function WhatsAppPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      <h2 className="text-lg font-bold text-gray-900">{t('whatsapp.connectTitle')}</h2>
      <p className="mt-2 mb-8 text-gray-500">{t('whatsapp.connectDesc')}</p>

      <QRScanner onConnected={handleConnected} />

      <button
        onClick={() => navigate('/')}
        className="mt-6 text-sm text-gray-400 transition hover:text-purple-500"
      >
        {t('whatsapp.skipManual')}
      </button>
    </div>
  )
}
