import Link from 'next/link'
import { Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'surface flex flex-col items-center justify-center gap-3 px-8 py-16 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-ink-faint">
        <Compass className="h-5 w-5" />
      </span>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? (
        <Button asChild variant="outline" className="mt-2">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}
