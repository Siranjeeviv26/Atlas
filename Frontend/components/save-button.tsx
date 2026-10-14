'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { api, buildQuery } from '@/lib/api'
import { useAuth } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface CheckResponse {
  favorited: boolean
}

export function SaveButton({
  entityType,
  entityId,
  name,
  className,
}: {
  entityType: 'destination' | 'package'
  entityId: string
  name: string
  className?: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const { data } = useQuery({
    queryKey: ['favorite-check', entityType, entityId],
    queryFn: () =>
      api<CheckResponse>(`/api/v1/favorites/check${buildQuery({ entityType, entityId })}`).then(
        (envelope) => (envelope.success ? envelope.data.favorited : false),
      ),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const saved = Boolean(data)

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        return api(`/api/v1/favorites`, {
          method: 'POST',
          body: { entityType, entityId },
        })
      }
      return api(`/api/v1/favorites/${entityType}/${entityId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorite-check', entityType, entityId] })
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (authLoading || mutation.isPending) return
    mutation.mutate(!saved)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      title={saved ? 'Saved' : 'Save'}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand bg-white transition-all duration-200',
        'hover:border-clay/40 hover:text-clay active:scale-95',
        saved && 'border-clay/30 bg-clay/10 text-clay',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
    </button>
  )
}
