import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthSessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { CopyrightFooter } from '@/components/license-notice'
import { ErrorTrackingProvider } from '@/components/error-tracking-provider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import JsonLd from './(components)/JsonLd'

const base = "https://www.whiterabbit.onl"

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "White Rabbit — Minimal, Open-Source Code Editor",
    template: "%s · White Rabbit",
  },
  description:
    "A clean, open code editor built by a visual artist — fast, minimal, and distraction-free.",
  alternates: { canonical: base },
  openGraph: {
    type: "website",
    url: base,
    siteName: "White Rabbit",
    title: "White Rabbit — Minimal, Open-Source Code Editor",
    description:
      "A clean, open code editor built by a visual artist — fast, minimal, and distraction-free.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "White Rabbit editor preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "White Rabbit — Minimal, Open-Source Code Editor",
    description:
      "A clean, open code editor built by a visual artist — fast, minimal, and distraction-free.",
    images: ["/og.jpg"],
  },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  generator: 'White Rabbit',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'White Rabbit',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6c2fff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#6c2fff" />
        <meta name="background-color" content="#0d0d0d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="White Rabbit" />
        <meta name="format-detection" content="telephone=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var finalTheme = theme === 'system' ? systemTheme : theme;
                  document.documentElement.classList.add(finalTheme);
                  document.documentElement.style.colorScheme = finalTheme;
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <JsonLd />
        <ErrorTrackingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthSessionProvider>
              {children}
              <CopyrightFooter />
              <Analytics />
              <SpeedInsights />
            </AuthSessionProvider>
          </ThemeProvider>
        </ErrorTrackingProvider>
      </body>
    </html>
  )
}
