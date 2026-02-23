import { Menu } from 'lucide-react'

interface TopBarProps {
  onToggleSidebar: () => void
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="bg-gradient-to-r from-[#00D4AA] to-[#00B4D8] bg-clip-text text-xl font-extrabold text-transparent">
        KITZ
      </h1>
      <div className="w-9" />
    </header>
  )
}
