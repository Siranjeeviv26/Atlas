import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, HeartHandshake, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'About',
  description: 'How Atlas picks trips, and what we promise travellers.',
}

const VALUES = [
  {
    icon: Compass,
    title: 'We have been there',
    body: 'Every destination and package in the atlas is one of our team has taken, or one a trusted local operator runs with us on the ground.',
  },
  {
    icon: ShieldCheck,
    title: 'Pricing you can trust',
    body: 'What you see is what you pay, with inclusions and exclusions spelled out before you enquire. No surprise fees at checkout.',
  },
  {
    icon: HeartHandshake,
    title: 'A person, not a chatbot',
    body: 'Enquiries land with a human who knows the itinerary. We reply within one working day — usually much sooner.',
  },
] as const

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">About Atlas</p>
        <h1 className="mt-2 text-balance font-display text-4xl font-semibold sm:text-5xl">
          Built by people who book the same trips you do.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-muted">
          Atlas started as a shared spreadsheet of places worth returning to. It is still that,
          honestly — just with better filters, real availability, and a team that answers when you
          ask a question.
        </p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {VALUES.map((value) => (
          <Card key={value.title} className="p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal">
              <value.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{value.body}</p>
          </Card>
        ))}
      </div>

      <section className="surface mt-16 p-6 text-center sm:p-10">
        <h2 className="font-display text-3xl font-semibold">Ready when you are</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          Browse the atlas, shortlist what you love, and send us a note about anything that looks
          close.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/destinations">Explore destinations</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/packages">Browse packages</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
