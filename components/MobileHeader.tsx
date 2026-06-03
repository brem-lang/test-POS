'use client'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
      <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="font-bold text-lg">POS System</span>
      <div className="w-9" />
    </header>
  )
}
