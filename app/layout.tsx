import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AS Business Survival Kit',
  description: 'Interactive study guide for Cambridge AS Business students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}