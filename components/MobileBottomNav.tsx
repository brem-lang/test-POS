'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home', icon: '📊' },
  { href: '/pos', label: 'POS', icon: '🛒' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/reports', label: 'Reports', icon: '📈' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
      {links.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
              active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-0.5">{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
