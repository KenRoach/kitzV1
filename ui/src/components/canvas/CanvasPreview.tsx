import {
  ArrowLeft,
  FileText,
  Presentation,
  ClipboardList,
  BarChart3,
  Palette,
  Image,
  Mail,
  Globe,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { useOrbStore } from '@/stores/orbStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import type { CanvasArtifact, ArtifactCategory } from '@/types/artifact'

/* ── Category icons & colors ── */

const CATEGORY_CONFIG: Record<ArtifactCategory, { icon: typeof FileText; labelKey: string; color: string }> = {
  document: { icon: FileText, labelKey: 'canvas.document', color: 'bg-purple-100 text-purple-600' },
  presentation: { icon: Presentation, labelKey: 'canvas.deck', color: 'bg-purple-100 text-purple-600' },
  plan: { icon: ClipboardList, labelKey: 'canvas.plan', color: 'bg-purple-100 text-purple-600' },
  report: { icon: BarChart3, labelKey: 'canvas.report', color: 'bg-purple-100 text-purple-600' },
  content: { icon: Palette, labelKey: 'canvas.content', color: 'bg-purple-100 text-purple-600' },
  media: { icon: Image, labelKey: 'canvas.media', color: 'bg-purple-100 text-purple-600' },
}

const STATUS_CONFIG: Record<CanvasArtifact['status'], { labelKey: string; color: string }> = {
  draft: { labelKey: 'canvas.draft', color: 'bg-gray-100 text-gray-600' },
  approved: { labelKey: 'canvas.approved', color: 'bg-purple-100 text-purple-700' },
  sent: { labelKey: 'canvas.sent', color: 'bg-purple-200 text-purple-800' },
}

/* ── Quick-create cards for empty state ── */

const QUICK_CREATES = [
  { labelKey: 'canvas.invoice', icon: FileText, prompt: 'Create an invoice for my client' },
  { labelKey: 'canvas.email', icon: Mail, prompt: 'Draft a professional business email' },
  { labelKey: 'canvas.landingPage', icon: Globe, prompt: 'Create a landing page for my business' },
  { labelKey: 'canvas.pitchDeck', icon: Presentation, prompt: 'Build a pitch deck for my business' },
  { labelKey: 'canvas.report', icon: BarChart3, prompt: 'Generate a business performance report' },
  { labelKey: 'canvas.image', icon: Image, prompt: 'Generate a promotional image for my business' },
] as const

/* ── Empty State ── */

function CanvasEmptyState() {
  const focusChat = useOrbStore((s) => s.focusChat)
  const sendMessage = useOrbStore((s) => s.sendMessage)
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="text-center mb-8">
        <Palette className="mx-auto mb-4 h-8 w-8 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">{t('canvas.whatToCreate')}</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {t('canvas.askKitzDesc')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-lg">
        {QUICK_CREATES.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.labelKey}
              onClick={() => {
                void sendMessage(item.prompt, 'default')
                focusChat()
              }}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-purple-300 hover:shadow-md hover:shadow-purple-500/5"
            >
              <Icon className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-semibold text-gray-700 group-hover:text-purple-600">
                {t(item.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Artifact Header ── */

function ArtifactHeader({ artifact }: { artifact: CanvasArtifact }) {
  const setActiveTab = useCanvasStore((s) => s.setActiveTab)
  const { t } = useTranslation()
  const catConfig = CATEGORY_CONFIG[artifact.category] || CATEGORY_CONFIG.document
  const statusConfig = STATUS_CONFIG[artifact.status] || STATUS_CONFIG.draft
  const CatIcon = catConfig.icon

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title={t('canvas.backToDashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <CatIcon className={cn('h-4 w-4', catConfig.color.replace(/bg-\S+/g, '').trim())} />
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[300px]">
            {artifact.title}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', catConfig.color)}>
          {t(catConfig.labelKey)}
        </span>
        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', statusConfig.color)}>
          {t(statusConfig.labelKey)}
        </span>
      </div>
    </div>
  )
}

/* ── Artifact Gallery (sidebar) ── */

function ArtifactGallery({ artifacts, selectedId }: { artifacts: CanvasArtifact[]; selectedId: string | null }) {
  const selectArtifact = useCanvasStore((s) => s.selectArtifact)

  if (artifacts.length <= 1) return null

  return (
    <div className="w-40 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-2 space-y-1.5">
      {artifacts.map((a) => {
        const catConfig = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.document
        const CatIcon = catConfig.icon
        const isSelected = a.id === selectedId

        return (
          <button
            key={a.id}
            onClick={() => selectArtifact(a.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg p-2 text-left transition',
              isSelected
                ? 'bg-purple-50 border border-purple-200'
                : 'hover:bg-gray-50 border border-transparent',
            )}
          >
            <CatIcon className={cn('h-4 w-4 shrink-0', catConfig.color.replace(/bg-\S+/g, '').trim())} />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[11px] font-medium truncate', isSelected ? 'text-purple-700' : 'text-gray-700')}>
                {a.title}
              </p>
              <p className="text-[9px] text-gray-400">
                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ── Action Bar ── */

function ActionBar({ artifact }: { artifact: CanvasArtifact }) {
  const { executeAction, actionLoading } = useCanvasStore()

  if (artifact.actions.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap border-t border-gray-200 bg-gray-50 px-4 py-3">
      {artifact.actions.map((action) => {
        const isLoading = actionLoading === action.id

        return (
          <button
            key={action.id}
            onClick={() => void executeAction(artifact.id, action)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition',
              action.type === 'primary' && 'bg-purple-600 text-white hover:bg-purple-700',
              action.type === 'secondary' && 'border border-purple-300 text-purple-600 hover:bg-purple-50',
              action.type === 'danger' && 'border border-gray-300 text-gray-600 hover:bg-gray-100',
              isLoading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ActionIcon actionId={action.id} />
            )}
            {action.label}
          </button>
        )
      })}
    </div>
  )
}

function ActionIcon({ actionId }: { actionId: string }) {
  switch (actionId) {
    case 'save_pdf': return <FileText className="h-3.5 w-3.5" />
    case 'send_email': return <Mail className="h-3.5 w-3.5" />
    case 'send_whatsapp': return <Send className="h-3.5 w-3.5" />
    case 'approve_plan': return <CheckCircle2 className="h-3.5 w-3.5" />
    default: return null
  }
}

/* ── Main CanvasPreview ── */

export function CanvasPreview() {
  const { artifacts, selectedArtifactId } = useCanvasStore()
  const { t } = useTranslation()

  if (artifacts.length === 0) {
    return <CanvasEmptyState />
  }

  const selected = artifacts.find((a) => a.id === selectedArtifactId) || artifacts[artifacts.length - 1]!

  return (
    <div className="flex h-full flex-col">
      <ArtifactHeader artifact={selected} />
      <div className="flex flex-1 overflow-hidden">
        <ArtifactGallery artifacts={artifacts} selectedId={selected.id} />
        {/* Artifact Viewer */}
        <div className="flex-1 overflow-hidden">
          {selected.html ? (
            <iframe
              srcDoc={selected.html}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts"
              title={selected.title}
            />
          ) : selected.previewUrl ? (
            <div className="flex h-full items-center justify-center bg-gray-50 p-8">
              <img
                src={selected.previewUrl}
                alt={selected.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <p className="text-sm">{t('canvas.noPreviewAvailable')}</p>
            </div>
          )}
        </div>
      </div>
      <ActionBar artifact={selected} />
    </div>
  )
}
