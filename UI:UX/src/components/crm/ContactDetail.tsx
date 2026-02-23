import { useState } from 'react'
import { X, Phone, Mail, Tag, MessageSquare, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore, STAGE_LABELS, STAGE_COLORS, PIPELINE_STAGES, type Lead } from '@/stores/workspaceStore'

interface ContactDetailProps {
  lead: Lead
  onClose: () => void
}

export function ContactDetail({ lead, onClose }: ContactDetailProps) {
  const { updateLeadStage, addLeadNote, addLeadTag, removeLeadTag, deleteLead } = useWorkspaceStore()
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showStageDropdown, setShowStageDropdown] = useState(false)

  const stageColor = STAGE_COLORS[lead.stage]

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    addLeadNote(lead.id, newNote.trim())
    setNewNote('')
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    addLeadTag(lead.id, newTag.trim().toLowerCase())
    setNewTag('')
  }

  const handleDelete = () => {
    void deleteLead(lead.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-black">{lead.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-gray-400">
              Added {new Date(lead.createdAt).toLocaleDateString()}
              {lead.source && <> · via <span className="text-gray-600">{lead.source}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
          {/* Stage selector */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Pipeline Stage
            </label>
            <div className="relative">
              <button
                onClick={() => setShowStageDropdown(!showStageDropdown)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition hover:border-[#00D4AA]/30',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-full', stageColor.dot)} />
                  <span className="font-semibold text-black">{STAGE_LABELS[lead.stage]}</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition', showStageDropdown && 'rotate-180')} />
              </button>
              {showStageDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {PIPELINE_STAGES.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        updateLeadStage(lead.id, stage)
                        setShowStageDropdown(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-gray-50',
                        lead.stage === stage && 'bg-gray-50',
                      )}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full', STAGE_COLORS[stage].dot)} />
                      <span className={lead.stage === stage ? 'font-semibold text-black' : 'text-gray-700'}>
                        {STAGE_LABELS[stage]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Contact Info
            </label>
            <div className="space-y-2">
              {lead.phone && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm text-black">{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm text-black">{lead.email}</span>
                </div>
              )}
              {lead.value != null && lead.value > 0 && (
                <div className="rounded-xl border border-gray-200 px-4 py-3">
                  <span className="font-mono text-xs text-gray-400">Deal value</span>
                  <p className="font-mono text-lg font-bold text-[#00D4AA]">${lead.value.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {lead.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-mono text-xs text-gray-700">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button onClick={() => removeLeadTag(lead.id, tag)} className="ml-1 text-gray-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm text-black placeholder-gray-400 outline-none focus:border-[#00D4AA]"
              />
              <button type="submit" className="rounded-xl bg-gray-100 px-4 py-2 font-mono text-xs font-medium text-gray-600 transition hover:bg-gray-200">
                Add
              </button>
            </form>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Notes
            </label>
            {lead.notes.length > 0 && (
              <div className="mb-3 space-y-2">
                {lead.notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-700">{note}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-black placeholder-gray-400 outline-none focus:border-[#00D4AA]"
              />
              <button type="submit" className="rounded-xl bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00E8BB]">
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleDelete}
            className="font-mono text-xs text-gray-400 transition hover:text-red-500"
          >
            Delete contact
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
