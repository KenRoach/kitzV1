import { KITZ_MANIFEST } from '@/data/kitz-manifest'

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Brand bar */}
      <div className="flex items-center gap-2">
        <span className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-sm font-bold uppercase tracking-wide text-transparent">
          {KITZ_MANIFEST.name}
        </span>
        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
          {KITZ_MANIFEST.tagline}
        </span>
      </div>

      {/* Page title + mission */}
      <h2 className="mt-3 text-2xl font-bold text-black">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {/* Divider */}
      <div className="mt-4 h-px bg-gradient-to-r from-purple-200 via-purple-100 to-transparent" />
    </div>
  )
}
