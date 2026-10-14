import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Atlas — trips worth the flight',
    template: '%s · Atlas',
  },
  description:
    'Hand-picked destinations, small-group packages and itineraries you can actually book. Plan a trip you will still talk about in ten years.',
  openGraph: {
    title: 'Atlas — trips worth the flight',
    description:
      'Hand-picked destinations, small-group packages and itineraries you can actually book.',
    type: 'website',
    siteName: 'Atlas',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-warm-white text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
