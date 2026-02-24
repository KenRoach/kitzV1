import { useState, useEffect } from 'react'
import { MapPin, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

interface CalendarEvent {
  id: string
  title: string
  time: string
  location?: string
  type: 'call' | 'meeting' | 'task' | 'follow-up'
}

const typeColors: Record<string, string> = {
  call: 'bg-blue-500',
  meeting: 'bg-purple-500',
  task: 'bg-amber-500',
  'follow-up': 'bg-purple-500',
}

export function CalendarTab() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true)
      try {
        const res = await apiFetch<{ events?: CalendarEvent[]; data?: CalendarEvent[] } | CalendarEvent[]>(
          `${API.KITZ_OS}/api/kitz`,
          {
            method: 'POST',
            body: JSON.stringify({ message: 'what is on my calendar today', channel: 'api', user_id: 'default' }),
          },
        )
        const data = Array.isArray(res) ? res : (
          (res as { events?: CalendarEvent[] }).events ??
          (res as { data?: CalendarEvent[] }).data ??
          []
        )
        setEvents(data)
      } catch {
        // Backend offline — leave empty
      }
      setIsLoading(false)
    }
    void fetchEvents()
  }, [])

  return (
    <div className="space-y-4">
      {/* Today header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black">Today</h3>
          <p className="font-mono text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Meeting
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Call
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Task
          </span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
          <CalendarDays className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No events today</p>
          <p className="text-xs text-gray-300">Connect Google Calendar or ask KITZ to schedule something</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && events.length > 0 && (
        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200"
            >
              <div className="flex items-center gap-2 pt-0.5 shrink-0 w-20">
                <span className={cn('h-2 w-2 rounded-full', typeColors[event.type] ?? 'bg-gray-400')} />
                <span className="font-mono text-xs text-gray-500">{event.time}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-black">{event.title}</p>
                {event.location && (
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
