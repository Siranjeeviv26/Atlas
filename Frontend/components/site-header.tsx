'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/packages', label: 'Packages' },
  { href: '/about', label: 'About' },
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close the mobile menu when navigation changes the path (render-time
  // adjustment instead of setState-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll and listen for Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-sand bg-warm-white/85 backdrop-blur-xl'
          : 'border-transparent bg-warm-white/60 backdrop-blur-sm',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-baseline gap-1.5" aria-label="Atlas home">
          <span className="font-display text-[22px] font-semibold tracking-tight text-midnight">
            Atlas
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-ink-faint transition-colors group-hover:text-teal sm:inline">
            Travel
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-parchment text-ink'
                  : 'text-ink-muted hover:bg-parchment/70 hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/saved" aria-label="Saved trips">
              <Heart className="h-4 w-4" />
              Saved
            </Link>
          </Button>

          {!isLoading && !isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">Join Atlas</Link>
              </Button>
            </>
          ) : null}

          {!isLoading && isAuthenticated ? (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/account">{user?.name?.split(' ')[0] ?? 'Account'}</Link>
            </Button>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <>
          {/* Backdrop: click anywhere below the header to dismiss. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-midnight/30 backdrop-blur-[2px] md:hidden"
          />
          <div className="relative z-50 border-t border-sand bg-warm-white md:hidden">
            <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-parchment"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/saved"
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-parchment"
              >
                Saved
              </Link>
              <div className="mt-2 border-t border-sand pt-3">
                {isAuthenticated ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/account">Account</Link>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline">
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Join Atlas</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  )
}
