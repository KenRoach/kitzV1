import { useEffect, useRef, useState } from 'react'

interface UseSSEOptions {
  url: string
  onMessage: (event: string, data: unknown) => void
  onError?: (error: Event) => void
  enabled?: boolean
}

export function useSSE({ url, onMessage, onError, enabled = true }: UseSSEOptions) {
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled) return

    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const data: unknown = JSON.parse(event.data as string)
        onMessage('message', data)
      } catch {
        onMessage('message', event.data)
      }
    }

    for (const eventType of ['session', 'qr', 'connected', 'error', 'logged_out']) {
      es.addEventListener(eventType, (event) => {
        try {
          const data: unknown = JSON.parse((event as MessageEvent).data as string)
          onMessage(eventType, data)
        } catch {
          onMessage(eventType, (event as MessageEvent).data)
        }
      })
    }

    es.onerror = (err) => {
      setConnected(false)
      onError?.(err)
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled])

  const close = () => {
    esRef.current?.close()
    esRef.current = null
    setConnected(false)
  }

  return { connected, close }
}
