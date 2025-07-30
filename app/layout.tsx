import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PersonalityThemeProvider } from '@/components/personality-toggle'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuthSessionProvider } from '@/components/session-provider'

export const metadata: Metadata = {
  title: 'Hex & Kex - Professional Code Development Environment',
  description: 'AI-powered code development environment with dual personalities',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-mono">
        <ErrorBoundary>
          <AuthSessionProvider>
            <PersonalityThemeProvider personality="hex">
              {children}
            </PersonalityThemeProvider>
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
