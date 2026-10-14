import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">This route is not on the map</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        The page you asked for does not exist — it may have moved, or the link may be incomplete.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/destinations">Browse destinations</Link>
        </Button>
      </div>
    </div>
  )
}
