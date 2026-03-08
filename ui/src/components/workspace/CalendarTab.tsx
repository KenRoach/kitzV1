import { useState, useEffect, useMemo } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, X, Edit3, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { CalendarEvent } from '@/stores/workspaceStore'
import { useTranslation } from '@/lib/i18n'

type ViewMode = 'month' | 'week' | 'day'

const EVENT_TYPE_COLORS: Record<CalendarEvent['type'], { bg: string; text: string; dot: string }> = {
  call: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  meeting: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
  task: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  'follow-up': { bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-500' },
  reminder: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  other: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

const EVENT_TYPES: CalendarEvent['type'][] = ['call', 'meeting', 'task', 'follow-up', 'reminder', 'other']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0=Sunday
  const start = new Date(year, month, 1 - startOffset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return days
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return days
}

function eventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = new Date(e.startTime)
    return isSameDay(eventDate, date)
  })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ---------- Component ----------

export function CalendarTab() {
  const { t } = useTranslation()
  const { calendarEvents, isLoading, fetchCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } =
    useWorkspaceStore()

  const DAY_NAMES = [
    t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
    t('calendar.thu'), t('calendar.fri'), t('calendar.sat'),
  ]
  const MONTH_NAMES = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'), t('calendar.april'),
    t('calendar.may'), t('calendar.june'), t('calendar.july'), t('calendar.august'),
    t('calendar.september'), t('calendar.october'), t('calendar.november'), t('calendar.december'),
  ]

  const today = useMemo(() => new Date(), [])
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState<ViewMode>('month')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState(toDateStr(today))
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formType, setFormType] = useState<CalendarEvent['type']>('meeting')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)

  useEffect(() => {
    void fetchCalendarEvents()
  }, [fetchCalendarEvents])

  // Navigation
  const goToday = () => {
    setCurrentDate(today)
    setSelectedDate(today)
  }
  const goPrev = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    else if (view === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1))
  }
  const goNext = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    else if (view === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1))
  }

  // Grid data
  const monthGrid = useMemo(() => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()), [currentDate])
  const weekDays = useMemo(() => getWeekDays(view === 'week' ? currentDate : selectedDate), [currentDate, selectedDate, view])

  const selectedDayEvents = useMemo(() => eventsForDay(calendarEvents, selectedDate), [calendarEvents, selectedDate])

  // Form handlers
  const resetForm = () => {
    setFormTitle('')
    setFormDate(toDateStr(selectedDate))
    setFormStartTime('09:00')
    setFormEndTime('10:00')
    setFormType('meeting')
    setFormLocation('')
    setFormDescription('')
    setFormAllDay(false)
    setEditingEvent(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    resetForm()
    setFormDate(toDateStr(selectedDate))
    setShowForm(true)
  }

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    const start = new Date(event.startTime)
    setFormDate(toDateStr(start))
    setFormStartTime(formatTime(event.startTime))
    setFormEndTime(formatTime(event.endTime))
    setFormType(event.type)
    setFormLocation(event.location || '')
    setFormDescription(event.description || '')
    setFormAllDay(event.allDay)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    const startTime = formAllDay ? `${formDate}T00:00:00` : `${formDate}T${formStartTime}:00`
    const endTime = formAllDay ? `${formDate}T23:59:59` : `${formDate}T${formEndTime}:00`

    const payload: Partial<CalendarEvent> = {
      title: formTitle,
      description: formDescription,
      startTime,
      endTime,
      allDay: formAllDay,
      location: formLocation,
      type: formType,
      status: 'scheduled',
    }

    if (editingEvent) {
      await updateCalendarEvent(editingEvent.id, payload)
    } else {
      await addCalendarEvent(payload)
    }
    resetForm()
  }

  const handleDelete = async (id: string) => {
    await deleteCalendarEvent(id)
    if (editingEvent?.id === id) resetForm()
  }

  // Header title
  const weekStart = weekDays[0] as Date
  const weekEnd = weekDays[6] as Date
  const headerTitle = view === 'month'
    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'week'
      ? `${t('calendar.week')} ${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]?.slice(0, 3) ?? ''} - ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]?.slice(0, 3) ?? ''} ${weekEnd.getFullYear()}`
      : `${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  return (
    <div className="space-y-4">
      {/* Top bar: view switcher + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v)
                if (v === 'day') setCurrentDate(selectedDate)
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition',
                view === v ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {v === 'month' ? t('calendar.month') : v === 'week' ? t('calendar.week') : t('calendar.day')}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100">
            {t('calendar.today')}
          </button>
          <button onClick={goNext} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-400"
        >
          <Plus className="h-4 w-4" /> {t('calendar.event')}
        </button>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-black">{headerTitle}</h3>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      {/* ---- MONTH VIEW ---- */}
      {view === 'month' && !isLoading && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {monthGrid.map((day, idx) => {
              const inMonth = day.getMonth() === currentDate.getMonth()
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, selectedDate)
              const dayEvents = eventsForDay(calendarEvents, day)
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-sm transition hover:bg-gray-50',
                    !inMonth && 'opacity-30',
                    isSelected && !isToday && 'bg-purple-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday && 'bg-purple-500 text-white',
                      !isToday && inMonth && 'text-black',
                      !isToday && !inMonth && 'text-gray-400',
                      isSelected && !isToday && 'ring-2 ring-purple-300',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn('h-1.5 w-1.5 rounded-full', EVENT_TYPE_COLORS[ev.type]?.dot ?? 'bg-gray-400')}
                        />
                      ))}
                      {dayEvents.length > 3 && <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- WEEK VIEW ---- */}
      {view === 'week' && !isLoading && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, today)
            const isSelected = isSameDay(day, selectedDate)
            const dayEvents = eventsForDay(calendarEvents, day)
            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex w-full flex-col items-center rounded-lg px-1 py-2 transition hover:bg-gray-50',
                    isSelected && 'bg-purple-50',
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{DAY_NAMES[idx]}</span>
                  <span
                    className={cn(
                      'mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      isToday && 'bg-purple-500 text-white',
                      !isToday && 'text-black',
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
                {/* Events listed under each day */}
                <div className="space-y-1">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedDate(day)
                        openEditForm(ev)
                      }}
                      className={cn(
                        'w-full rounded-md px-1.5 py-1 text-left text-[11px] font-medium leading-tight truncate',
                        EVENT_TYPE_COLORS[ev.type]?.bg ?? 'bg-gray-100',
                        EVENT_TYPE_COLORS[ev.type]?.text ?? 'text-gray-600',
                      )}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ---- DAY VIEW ---- */}
      {view === 'day' && !isLoading && (
        <div className="space-y-2">
          {eventsForDay(calendarEvents, currentDate).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
              <CalendarDays className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">{t('calendar.noEventsDay')}</p>
            </div>
          ) : (
            eventsForDay(calendarEvents, currentDate).map((ev) => (
              <EventCard key={ev.id} event={ev} onEdit={openEditForm} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}

      {/* ---- Selected day events (month/week views) ---- */}
      {view !== 'day' && !isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h4>
            <span className="text-xs text-gray-400">{selectedDayEvents.length} {t('calendar.event')}{selectedDayEvents.length !== 1 ? 's' : ''}</span>
          </div>
          {selectedDayEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
              <CalendarDays className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">{t('calendar.noEventsSelected')}</p>
              <button
                onClick={openCreateForm}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-400"
              >
                <Plus className="h-3.5 w-3.5" /> {t('calendar.createEvent')}
              </button>
            </div>
          )}
          {selectedDayEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} onEdit={openEditForm} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ---- Create / Edit Form ---- */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingEvent ? t('calendar.editEvent') : t('calendar.newEvent')}
            </h3>
            <button onClick={resetForm} className="text-gray-400 transition hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.titleRequired')}</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                placeholder={t('calendar.eventName')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.date')}</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.start')}</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  disabled={formAllDay}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.end')}</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  disabled={formAllDay}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formAllDay}
                onChange={(e) => setFormAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="allDay" className="text-xs text-gray-600">{t('calendar.allDay')}</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.type')}</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as CalendarEvent['type'])}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
                >
                  {EVENT_TYPES.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp === 'call' ? t('calendar.call') : tp === 'meeting' ? t('calendar.meeting') : tp === 'task' ? t('calendar.task') : tp === 'follow-up' ? t('calendar.followUp') : tp === 'reminder' ? t('calendar.reminder') : t('calendar.other')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.location')}</label>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder={t('calendar.locationPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('calendar.descriptionLabel')}</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('calendar.descriptionPlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-400"
              >
                <Plus className="h-4 w-4" /> {editingEvent ? t('calendar.save') : t('calendar.create')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
              >
                {t('calendar.cancelBtn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ---------- Event Card ----------

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent
  onEdit: (e: CalendarEvent) => void
  onDelete: (id: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const colors = EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.other

  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200">
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <span className={cn('h-2.5 w-2.5 rounded-full', colors.dot)} />
        {!event.allDay && (
          <span className="font-mono text-[11px] text-gray-400">{formatTime(event.startTime)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-black truncate">{event.title}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', colors.bg, colors.text)}>
            {event.type}
          </span>
        </div>
        {event.description && (
          <p className="mt-0.5 text-xs text-gray-400 truncate">{event.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {!event.allDay && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          )}
          {event.allDay && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {t('calendar.allDay')}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => onEdit(event)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Edit event"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => void onDelete(event.id)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete event"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
