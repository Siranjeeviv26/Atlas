'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Heart, MessageSquare, User as UserIcon } from 'lucide-react'
import { apiData } from '@/lib/api'
import type { Enquiry, FavoriteItem, Profile } from '@/lib/types'
import { formatDate, titleCase } from '@/lib/utils'
import { useAuth } from '@/lib/auth-client'
import { Badge, Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { SaveButton } from '@/components/save-button'
import { ProfileSettings } from '@/components/profile-settings'

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?next=/account')
    }
  }, [isLoading, isAuthenticated, router])

  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiData<FavoriteItem[] | { items: FavoriteItem[] }>('/api/v1/favorites'),
    enabled: isAuthenticated,
  })

  const enquiries = useQuery({
    queryKey: ['enquiries', 'mine'],
    queryFn: () => apiData<Enquiry[] | { items: Enquiry[] }>('/api/v1/enquiries'),
    enabled: isAuthenticated,
  })

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiData<Profile>('/api/v1/me'),
    enabled: isAuthenticated,
  })

  async function handleLogout() {
    await logout()
    router.push('/')
    router.refresh()
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container-page py-20">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  const favoriteItems = Array.isArray(favorites.data) ? favorites.data : favorites.data?.items ?? []
  const enquiryItems = Array.isArray(enquiries.data) ? enquiries.data : enquiries.data?.items ?? []
  const me = profile.data

  return (
    <div className="container-page py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            {me?.name ?? user?.name ?? 'Traveller'}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span>{me?.email ?? user?.email}</span>
            {me?.role === 'admin' ? <Badge tone="teal">Admin</Badge> : null}
            {me ? (
              <span className="flex items-center gap-1.5 text-ink-faint">
                <UserIcon className="h-3.5 w-3.5" />
                Member since {formatDate(user?.createdAt)}
              </span>
            ) : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-teal" />
            <h2 className="font-display text-xl font-semibold">Saved trips</h2>
            <span className="text-sm text-ink-faint">({favoriteItems.length})</span>
          </div>

          {favoriteItems.length ? (
            <ul className="mt-4 space-y-3">
              {favoriteItems.map((item) => {
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
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-parchment">
                        {image ? (
                          <Image
                            src={image}
                            alt=""
                            width={96}
                            height={64}
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
                        <p className="mt-1 text-[12px] text-ink-faint">
                          Saved {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <SaveButton entityType={item.entityType} entityId={item.entityId} name={title} />
                    </Card>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              title="Nothing saved yet"
              description="Tap the heart on any destination or package to keep it here."
              action={{ href: '/destinations', label: 'Explore destinations' }}
            />
          )}
        </section>

        <section>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal" />
            <h2 className="font-display text-xl font-semibold">Your enquiries</h2>
            <span className="text-sm text-ink-faint">({enquiryItems.length})</span>
          </div>

          {enquiryItems.length ? (
            <ul className="mt-4 space-y-3">
              {enquiryItems.map((enquiry) => (
                <li key={enquiry.id}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{enquiry.subject}</p>
                        <p className="mt-0.5 text-[13px] text-ink-muted">
                          {enquiry.packageTitle ?? enquiry.destinationName ?? 'General enquiry'}
                        </p>
                      </div>
                      <Badge
                        tone={
                          enquiry.status === 'resolved'
                            ? 'teal'
                            : enquiry.status === 'cancelled'
                              ? 'neutral'
                              : 'amber'
                        }
                      >
                        {titleCase(enquiry.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{enquiry.message}</p>
                    <p className="mt-2 text-[12px] text-ink-faint">
                      Sent {formatDate(enquiry.createdAt)} · {enquiry.travellers} traveller
                      {enquiry.travellers === 1 ? '' : 's'}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              title="No enquiries yet"
              description="Ask us about any package and it will show up here."
              action={{ href: '/packages', label: 'Browse packages' }}
            />
          )}
        </section>
      </div>

      <ProfileSettings />
    </div>
  )
}
