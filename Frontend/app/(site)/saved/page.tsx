'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { apiData } from '@/lib/api'
import type { FavoriteItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth-client'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { SaveButton } from '@/components/save-button'

export default function SavedPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiData<FavoriteItem[] | { items: FavoriteItem[] }>('/api/v1/favorites'),
    enabled: isAuthenticated,
  })

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <div className="skeleton h-10 w-40 rounded-xl" />
        <div className="skeleton mt-6 h-40 rounded-2xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Sign in to see your saved trips"
          description="Your shortlist lives with your account, so it follows you across devices."
          action={{ href: '/login?next=/saved', label: 'Sign in' }}
        />
      </div>
    )
  }

  const items = Array.isArray(favorites.data) ? favorites.data : favorites.data?.items ?? []

  return (
    <div className="container-page py-14">
      <header className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-clay" />
        <div>
          <p className="eyebrow">Shortlist</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Saved trips</h1>
        </div>
      </header>

      {items.length ? (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const dest = item.destination
            const pkg = item.package
            const href =
              item.entityType === 'destination' && dest
                ? `/destinations/${dest.slug}`
                : pkg
                  ? `/packages/${pkg.slug}`
                  : '#'
            const title = dest?.name ?? pkg?.title ?? 'Saved item'
            const subtitle = dest
              ? `${dest.country} · ${dest.continent}`
              : pkg
                ? `${pkg.destination?.name} · ${pkg.durationDays} days`
                : ''
            const image = dest?.heroImageUrl ?? pkg?.heroImageUrl

            return (
              <li key={item.id}>
                <Card className="flex items-center gap-4 p-4">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-parchment">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        width={112}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      <Link href={href} className="hover:underline">
                        {title}
                      </Link>
                    </p>
                    <p className="truncate text-sm text-ink-muted">{subtitle}</p>
                    <p className="mt-1 text-[12px] text-ink-faint">Saved {formatDate(item.createdAt)}</p>
                  </div>
                  <SaveButton entityType={item.entityType} entityId={item.entityId} name={title} />
                </Card>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          className="mt-10"
          title="Nothing saved yet"
          description="Tap the heart on any destination or package to keep it here."
          action={{ href: '/destinations', label: 'Explore destinations' }}
        />
      )}
    </div>
  )
}
