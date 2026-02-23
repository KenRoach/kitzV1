import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

type ScanState = 'waiting' | 'scanning' | 'connected' | 'error'

const RING_RADIUS = 140
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const QR_TIMEOUT = 60

interface QRScannerProps {
  onConnected?: (phone: string) => void
}

export function QRScanner({ onConnected }: QRScannerProps) {
  const [state, setState] = useState<ScanState>('waiting')
  const [qrData, setQrData] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(QR_TIMEOUT)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const user = useAuthStore((s) => s.user)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(QR_TIMEOUT)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleMessage = useCallback(
    (event: string, data: unknown) => {
      const d = data as Record<string, string>
      switch (event) {
        case 'qr':
          setQrData(d.qr ?? '')
          setState('scanning')
          resetTimer()
          break
        case 'connected':
          setState('connected')
          setPhone(d.phone ?? '')
          if (timerRef.current) clearInterval(timerRef.current)
          onConnected?.(d.phone ?? '')
          break
        case 'error':
          setState('error')
          setError(d.error ?? 'Connection failed')
          if (timerRef.current) clearInterval(timerRef.current)
          break
        case 'logged_out':
          setState('waiting')
          setQrData(null)
          break
      }
    },
    [resetTimer, onConnected],
  )

  const sseUrl = `/api/whatsapp/whatsapp/connect?userId=${user?.id ?? 'default'}`

  const { close } = useSSE({
    url: sseUrl,
    onMessage: handleMessage,
    enabled: state !== 'connected',
  })

  useEffect(() => {
    return () => {
      close()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [close])

  const dashOffset = RING_CIRCUMFERENCE * (1 - countdown / QR_TIMEOUT)
  const ringColor = countdown < 10 ? '#EF4444' : 'rgb(168,85,247)'

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-72 w-72 items-center justify-center">
        {/* Countdown ring */}
        <svg className="absolute inset-0" viewBox="0 0 300 300">
          <circle
            cx="150" cy="150" r={RING_RADIUS}
            fill="none" stroke="#E5E7EB" strokeWidth="4"
          />
          <circle
            cx="150" cy="150" r={RING_RADIUS}
            fill="none" stroke={ringColor} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000"
            transform="rotate(-90 150 150)"
          />
        </svg>

        {/* Center content */}
        <div className="z-10 flex h-56 w-56 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          {state === 'waiting' && (
            <p className="text-sm text-gray-400">Waiting for QR...</p>
          )}
          {state === 'scanning' && qrData && (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="grid h-40 w-40 grid-cols-1 place-items-center rounded-lg bg-gray-50">
                <p className="break-all px-2 text-center font-mono text-[8px] leading-tight text-gray-600">
                  {qrData.slice(0, 200)}
                </p>
              </div>
              <p className="text-xs text-gray-400">{countdown}s</p>
            </div>
          )}
          {state === 'connected' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500">
                <Check className="h-7 w-7 text-white" />
              </div>
              <p className="font-semibold text-black">Connected!</p>
              <p className="text-sm text-gray-500">{phone}</p>
            </div>
          )}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 px-4">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => {
                  setState('waiting')
                  setError('')
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200 transition',
                )}
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
