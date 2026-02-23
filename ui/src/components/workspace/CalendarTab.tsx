import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  title: string
  time: string
  location?: string
  type: 'call' | 'meeting' | 'task' | 'follow-up'
}

const TODAY_EVENTS: Event[] = [
  { id: '1', title: 'Follow up with Maria Rodriguez', time: '9:00 AM', type: 'follow-up' },
  { id: '2', title: 'Product demo — Carlos Mendez', time: '10:30 AM', location: 'Google Meet', type: 'call' },
  { id: '3', title: 'Review weekly pipeline report', time: '12:00 PM', type: 'task' },
  { id: '4', title: 'Client onboarding — Ana Gutierrez', time: '2:00 PM', location: 'WhatsApp', type: 'meeting' },
  { id: '5', title: 'Send invoice batch', time: '4:00 PM', type: 'task' },
]

const typeColors = {
  call: 'bg-blue-500',
  meeting: 'bg-purple-500',
  task: 'bg-amber-500',
  'follow-up': 'bg-purple-500',
}

export function CalendarTab() {
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
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Follow-up
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {TODAY_EVENTS.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200"
          >
            <div className="flex items-center gap-2 pt-0.5 shrink-0 w-20">
              <span className={cn('h-2 w-2 rounded-full', typeColors[event.type])} />
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
    </div>
  )
}
