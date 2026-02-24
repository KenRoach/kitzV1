import { useState, useRef } from 'react'
import { useOrbStore } from '@/stores/orbStore'

export function useKitzVoice() {
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = async (text: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setSpeaking(true)
    useOrbStore.getState().setSpeaking(true)

    try {
      const res = await fetch('/api/kitz/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        throw new Error(`TTS failed: ${res.status}`)
      }

      const data = await res.json() as { audio_base64?: string; mime_type?: string }
      if (!data.audio_base64) throw new Error('No audio data')

      const audio = new Audio(`data:${data.mime_type || 'audio/mpeg'};base64,${data.audio_base64}`)
      audioRef.current = audio

      audio.onended = () => {
        setSpeaking(false)
        useOrbStore.getState().setSpeaking(false)
        audioRef.current = null
      }
      audio.onerror = () => {
        setSpeaking(false)
        useOrbStore.getState().setSpeaking(false)
        audioRef.current = null
      }

      await audio.play()
    } catch {
      setSpeaking(false)
      useOrbStore.getState().setSpeaking(false)
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
    useOrbStore.getState().setSpeaking(false)
  }

  return { speak, stop, speaking }
}
