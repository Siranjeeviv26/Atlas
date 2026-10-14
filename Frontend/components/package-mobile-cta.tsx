'use client'

import { formatPrice } from '@/lib/utils'

/**
 * Sticky bottom action bar shown on mobile/tablet only (hidden at lg+ where
 * the enquiry form is visible alongside the itinerary). Surfaces the price
 * and a one-tap jump to the form so the conversion path is never buried.
 */
export function PackageMobileCta({
  priceCents,
  currency,
}: {
  priceCents: number
  currency?: string
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-warm-white/95 backdrop-blur-lg lg:hidden">
      <div className="container-page flex items-center justify-between gap-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">From, per person</p>
          <p className="font-display text-xl font-semibold">{formatPrice(priceCents, currency)}</p>
        </div>
        <a
          href="#enquire"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-teal px-6 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(31,168,160,0.9)] transition-colors hover:bg-teal-dark active:scale-[0.98]"
        >
          Enquire now
        </a>
      </div>
    </div>
  )
}
