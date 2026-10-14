import Image from 'next/image'
import type { Testimonial } from '@/lib/types'
import { Card, Rating } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function TestimonialRow({ testimonials }: { testimonials: Testimonial[] }) {
  const rows = [testimonials.slice(0, 2), testimonials.slice(2, 4), testimonials.slice(4, 6)]
  const visible = rows.filter((row) => row.length > 0)

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {visible.map((row, rowIndex) => (
        <div key={rowIndex} className={cn('flex flex-col gap-6', rowIndex === 1 && 'lg:mt-10')}>
          {row.map((item) => (
            <Card key={item.id} className="p-6">
              <Rating value={item.rating} className="mb-3" />
              <blockquote className="text-[15px] leading-relaxed text-ink">
                “{item.content}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-sand pt-4">
                {item.avatarUrl ? (
                  <span className="relative h-10 w-10 overflow-hidden rounded-full bg-parchment">
                    <Image
                      src={item.avatarUrl}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment font-display text-sm font-semibold text-ink">
                    {item.name.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-[13px] text-ink-faint">
                    {[item.role, item.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </figcaption>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
