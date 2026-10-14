import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80'

/**
 * Split-screen shell shared by the auth pages.
 *
 * Left half is a full-bleed travel image with a glossy sheen overlay, the
 * Atlas brand, and a short value-prop. Right half is a clean form area.
 */
export function AuthLayout({
  eyebrow,
  heading,
  subheading,
  image = DEFAULT_IMAGE,
  children,
}: {
  eyebrow: string
  heading: string
  subheading?: string
  image?: string
  children: ReactNode
}) {
  return (
    <div className="flex h-[100svh] flex-col overflow-hidden lg:flex-row">
      {/* ── Visual panel ─────────────────────────────────── */}
      <aside className="relative h-40 shrink-0 overflow-hidden sm:h-52 lg:h-full lg:w-[48%] lg:shrink">
        {/* Full-bleed image */}
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="object-cover scale-105"
        />

        {/* Dark gradient for text legibility */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/25 to-midnight/85 lg:bg-gradient-to-r lg:from-midnight/70 lg:via-midnight/20 lg:to-midnight/40"
        />

        {/* Glossy sheen — diagonal light streak */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.14)_50%,rgba(255,255,255,0.08)_55%,transparent_70%)]"
        />

        {/* Glossy top highlight */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/12 to-transparent"
        />

        {/* Vignette */}
        <div
          aria-hidden
          className="absolute inset-0 shadow-[inset_0_0_80px_rgba(11,18,32,0.35)]"
        />

        {/* Brand — top-left */}
        <Link
          href="/"
          className="absolute left-6 top-5 z-10 flex items-baseline gap-1.5 sm:left-8 sm:top-6 lg:left-10 lg:top-8"
        >
          <span className="font-display text-[22px] font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            Atlas
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-white/70 sm:inline">
            Travel
          </span>
        </Link>

        {/* Copy — bottom-left (desktop only) */}
        <div className="absolute inset-x-0 bottom-0 z-10 hidden p-10 lg:block xl:p-14">
          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3 w-3" aria-hidden />
              Hand-curated trips
            </span>
            <p className="mt-5 font-display text-[32px] font-semibold leading-[1.15] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] xl:text-[38px]">
              Trips worth the flight.
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              Save destinations, track your enquiries, and pick up your shortlist
              any time you sign in.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Form panel ───────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center overflow-y-auto bg-warm-white px-5 py-6 sm:px-8 lg:overflow-hidden lg:px-12">
        <div className="w-full max-w-md animate-fade-up">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight sm:text-[30px]">{heading}</h1>
          {subheading ? (
            <p className="mt-1 text-sm leading-snug text-ink-muted">{subheading}</p>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Reusable "or" divider between the email form and the Google button.
 */
export function AuthDivider() {
  return (
    <div className="relative my-3" aria-hidden>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-sand" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-warm-white px-3 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          or
        </span>
      </div>
    </div>
  )
}
