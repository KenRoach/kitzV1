import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Upload,
  FileText,
  Search,
  Trash2,
  Plus,
  X,
  Loader2,
  FolderOpen,
  Globe,
  Briefcase,
  Tag,
} from 'lucide-react'
import { useKnowledgeStore, type KnowledgeEntry } from '@/stores/knowledgeStore'
import { cn } from '@/lib/utils'

/* ── Category config ── */

const CATEGORIES = [
  { id: 'general', label: 'General', icon: FolderOpen, color: 'bg-gray-100 text-gray-600' },
  { id: 'brand', label: 'Brand', icon: Tag, color: 'bg-purple-100 text-purple-600' },
  { id: 'product', label: 'Product', icon: Briefcase, color: 'bg-purple-50 text-purple-500' },
  { id: 'market', label: 'Market', icon: Globe, color: 'bg-gray-100 text-gray-500' },
  { id: 'sop', label: 'SOP', icon: FileText, color: 'bg-purple-50 text-purple-500' },
] as const

function getCategoryConfig(cat: string) {
  return CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0]
}

/* ── Add Knowledge Modal ── */

function AddKnowledgeModal({ onClose }: { onClose: () => void }) {
  const addEntry = useKnowledgeStore((s) => s.addEntry)
  const loading = useKnowledgeStore((s) => s.loading)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setContent(text)
      if (!title) setTitle(file.name.replace(/\.\w+$/, ''))
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await addEntry({ title: title || 'Untitled', content, category })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Knowledge</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brand Guidelines, Pricing Sheet..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition border',
                      category === cat.id
                        ? 'border-purple-300 bg-purple-50 text-purple-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your document content, business info, pricing, SOPs, or anything Kitz should know about your business..."
              rows={8}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* File upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-500 transition hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              Upload a file (.txt, .md, .csv, .json)
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition',
              content.trim() && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add to Knowledge Base
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Knowledge Entry Card ── */

function KnowledgeCard({ entry }: { entry: KnowledgeEntry }) {
  const deleteEntry = useKnowledgeStore((s) => s.deleteEntry)
  const [expanded, setExpanded] = useState(false)
  const catConfig = getCategoryConfig(entry.category)
  const CatIcon = catConfig.icon

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <CatIcon className={cn('h-4 w-4 shrink-0', catConfig.color.replace(/bg-\S+/g, '').trim())} />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {entry.title || entry.source}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', catConfig.color)}>
                {catConfig.label}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(entry.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => void deleteEntry(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preview */}
      <div className="mt-3">
        <p className={cn('text-xs text-gray-500 leading-relaxed', !expanded && 'line-clamp-3')}>
          {entry.content}
        </p>
        {entry.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[11px] font-medium text-purple-600 hover:text-purple-700"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ── */

export function KnowledgePage() {
  const { entries, loading, searchQuery, setSearchQuery, fetchEntries } = useKnowledgeStore()
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  const filtered = searchQuery
    ? entries.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : entries

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Knowledge Center</h2>
            <p className="text-xs text-gray-500">
              Upload docs, brand info, and business context — Kitz uses this to give you smarter answers.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <span>{entries.length} document{entries.length !== 1 ? 's' : ''}</span>
        <span>{new Set(entries.map((e) => e.category)).size} categor{new Set(entries.map((e) => e.category)).size !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* Content */}
      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-8 w-8 text-purple-300" />
          <h3 className="text-sm font-semibold text-gray-900">
            {searchQuery ? 'No results found' : 'No knowledge yet'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            {searchQuery
              ? 'Try a different search term.'
              : 'Add your brand guidelines, pricing, SOPs, or any business context. Kitz will use this to give you better, more personalized answers.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add your first document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <KnowledgeCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && <AddKnowledgeModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
