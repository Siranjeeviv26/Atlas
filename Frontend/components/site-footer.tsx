import Link from 'next/link'
import { NewsletterForm } from '@/components/newsletter-form'

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/destinations', label: 'Destinations' },
      { href: '/packages', label: 'Packages' },
      { href: '/destinations?category=beach', label: 'Beach' },
      { href: '/destinations?category=adventure', label: 'Adventure' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Atlas' },
      { href: '/account', label: 'My enquiries' },
      { href: '/saved', label: 'Saved trips' },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-midnight text-on-dark">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
        <div>
          <p className="font-display text-2xl font-semibold">Atlas</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-dark-muted">
            Small-group journeys and independent itineraries, chosen by people who have actually
            taken them.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="eyebrow text-on-dark-muted">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-dark/90 transition-colors hover:text-teal-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="eyebrow text-on-dark-muted">The dispatch</p>
          <p className="mt-4 text-sm leading-relaxed text-on-dark-muted">
            One email a month: new routes, quiet-season fares, and where we are heading next.
          </p>
          <NewsletterForm className="mt-4" tone="dark" />
        </div>
      </div>

      <div className="border-t border-midnight-700">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-on-dark-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Atlas Travel. All rights reserved.</p>
          <p>Photography via the Unsplash License.</p>
        </div>
      </div>
    </footer>
  )
}
