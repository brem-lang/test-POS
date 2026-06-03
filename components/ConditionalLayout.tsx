'use client'

import { usePathname } from 'next/navigation'
import Layout from './Layout'
import { Toaster } from 'react-hot-toast'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/login') {
    return (
      <>
        {children}
        <Toaster position="top-center" />
      </>
    )
  }
  return <Layout>{children}</Layout>
}
