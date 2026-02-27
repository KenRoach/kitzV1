import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, RefreshCw, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useSSE } from '@/hooks/useSSE'
import { useAuthStore } from '@/stores/authStore'
import { API } from '@/lib/constants'
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
  const [reconnectKey, setReconnectKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cleanedRef = useRef(false)
  const user = useAuthStore((s) => s.user)

  // On mount: fire-and-forget DELETE to clear stale sessions (SSE starts immediately)
  useEffect(() => {
    if (cleanedRef.current) return
    cleanedRef.current = true
    const userId = user?.id ?? 'default'
    fetch(`${API.WHATSAPP}/whatsapp/sessions/${userId}`, { method: 'DELETE' }).catch(() => {})
  }, [user?.id])

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
      // QR data comes as a raw string from Baileys (not wrapped in JSON)
      if (event === 'qr') {
        const qr = typeof data === 'string'
          ? data
          : (data as Record<string, string>).qr ?? ''
        if (qr) {
          setQrData(qr)
          setState('scanning')
          resetTimer()
        }
        return
      }

      const d = typeof data === 'string' ? {} : (data as Record<string, string>)

      switch (event) {
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
        case 'disconnected':
          // QR expired or connection dropped — auto-retry after 1s
          if (timerRef.current) clearInterval(timerRef.current)
          setState('waiting')
          setQrData(null)
          retryTimerRef.current = setTimeout(() => {
            setReconnectKey((k) => k + 1)
          }, 1000)
          break
      }
    },
    [resetTimer, onConnected],
  )

  const sseUrl = `${API.WHATSAPP}/whatsapp/connect?userId=${user?.id ?? 'default'}`

  const { close } = useSSE({
    url: sseUrl,
    onMessage: handleMessage,
    onError: () => {
      // SSE connection failed (404, network error, etc.) — show retry button
      if (state !== 'connected') {
        setState('error')
        setError('Could not connect to WhatsApp service. Check that the connector is running.')
      }
    },
    enabled: state !== 'connected',
    reconnectKey,
  })

  useEffect(() => {
    return () => {
      close()
      if (timerRef.current) clearInterval(timerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          {state === 'scanning' && (
            <circle
              cx="150" cy="150" r={RING_RADIUS}
              fill="none" stroke={ringColor} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
              transform="rotate(-90 150 150)"
            />
          )}
        </svg>

        {/* Center content */}
        <div className="z-10 flex h-56 w-56 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          {state === 'waiting' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm text-gray-400">Connecting...</p>
            </div>
          )}
          {state === 'scanning' && qrData && (
            <div className="flex flex-col items-center gap-2 p-3">
              <QRCodeSVG
                value={qrData}
                size={176}
                level="M"
                bgColor="transparent"
                fgColor="#1a1a1a"
              />
              <p className={cn(
                'text-xs font-medium',
                countdown < 10 ? 'text-red-500' : 'text-gray-400',
              )}>
                {countdown < 10 ? `${countdown}s — scan now!` : `${countdown}s`}
              </p>
            </div>
          )}
          {state === 'connected' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
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
                  setReconnectKey((k) => k + 1)
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
