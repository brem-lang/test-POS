'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/pos', label: 'POS', icon: '🛒' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/open-session', label: 'Open Session', icon: '🔓' },
  { href: '/close-session', label: 'Close Session', icon: '🔒' },
]

interface SidebarProps {
  onLogout?: () => void
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    onLogout?.()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col py-6 px-3">
      <div className="px-3 mb-8">
        <h1 className="text-xl font-bold text-white">POS System</h1>
        <p className="text-gray-400 text-xs mt-1">Point of Sale</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <span>🚪</span>
        Logout
      </button>
    </aside>
  )
}
