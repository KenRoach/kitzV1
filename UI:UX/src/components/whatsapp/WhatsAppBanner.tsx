import { MessageCircle, X } from 'lucide-react'

interface WhatsAppBannerProps {
  onConnect: () => void
  onDismiss: () => void
}

export function WhatsAppBanner({ onConnect, onDismiss }: WhatsAppBannerProps) {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B4D8] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-white" />
          <p className="text-sm font-medium text-white">
            Connect WhatsApp to unlock full features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onConnect}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/30"
          >
            Connect now
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
