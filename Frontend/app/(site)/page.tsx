import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";
import { apiData, buildQuery } from "@/lib/api";
import type { HomePayload, PackageFacets } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Badge, Card, Rating } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DestinationCard, PackageCard } from "@/components/trip-cards";
import { NewsletterForm } from "@/components/newsletter-form";
import { TestimonialRow } from "@/components/testimonial-row";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";
import { DestinationSearch } from "@/components/destination-search";

export const revalidate = 300;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

async function getHome(): Promise<HomePayload | null> {
  try {
    return await apiData<HomePayload>("/api/v1/home", {
      next: { revalidate: 300 },
    });
  } catch {
    return null;
  }
}

async function getStyles(): Promise<{ style: string; count: number }[]> {
  try {
    const facets = await apiData<PackageFacets>("/api/v1/packages/facets", {
      next: { revalidate: 300 },
    });
    return facets.styles ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [home, styles] = await Promise.all([getHome(), getStyles()]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/70 via-midnight/45 to-warm-white" />
        </div>

        <div className="container-page flex min-h-[78vh] flex-col justify-end pb-20 pt-24">
          <Stagger className="max-w-3xl">
            <StaggerItem>
              <Badge tone="outline" className="border-white/30 bg-white/10 text-white backdrop-blur">
                <Sparkles className="h-3 w-3" />
                Spring 2026 collection is live
              </Badge>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mt-6 text-balance font-display text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                Trips worth the flight.
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-white/80">
                Hand-picked destinations and small-group packages, built by
                people who have actually taken the route. Browse, save what you
                love, and ask us anything.
              </p>
            </StaggerItem>
            <StaggerItem>
              <DestinationSearch className="mt-8 max-w-xl" tone="dark" />
            </StaggerItem>
            <StaggerItem>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/destinations">
                    Explore destinations
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost-light"
                  size="lg"
                  className="border border-white/25"
                >
                  <Link href="/packages">Browse packages</Link>
                </Button>
              </div>
            </StaggerItem>
          </Stagger>

          {home?.stats ? (
            <Stagger
              className="mt-16 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/20 pt-8 sm:gap-6"
              stagger={0.12}
            >
              {[
                {
                  icon: Compass,
                  label: "Destinations",
                  value: home.stats.destinations,
                },
                { icon: Users, label: "Packages", value: home.stats.packages },
                {
                  icon: Sparkles,
                  label: "Countries",
                  value: home.stats.countries,
                },
              ].map((stat) => (
                <StaggerItem key={stat.label}>
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/60">
                      <stat.icon className="h-3.5 w-3.5" />
                      {stat.label}
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          ) : null}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      {home?.categories?.length ? (
        <section className="container-page -mt-4 py-12">
          <div className="flex flex-wrap gap-2">
            {home.categories.slice(0, 8).map((item) => (
              <Link
                key={item.style}
                href={`/destinations?category=${encodeURIComponent(item.style)}`}
                className="group inline-flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-teal hover:text-teal-dark"
              >
                {titleCase(item.style)}
                <span className="text-[12px] text-ink-faint">{item.count}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Curated experiences ──────────────────────────── */}
      {styles.length ? (
        <section className="container-page pb-4">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Curated experiences</p>
                <h2 className="mt-2 text-balance font-display text-3xl font-semibold">
                  Travel the way you like
                </h2>
              </div>
              <Button asChild variant="ghost">
                <Link href="/packages">
                  All styles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {styles.slice(0, 8).map((item) => (
                <Link
                  key={item.style}
                  href={`/packages${buildQuery({ style: item.style })}`}
                  className="group surface flex items-center justify-between gap-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {titleCase(item.style)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-faint">
                      {item.count} {item.count === 1 ? "package" : "packages"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-all group-hover:translate-x-1 group-hover:text-teal" />
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* ── Featured destinations ────────────────────────── */}
      {home?.featuredDestinations?.length ? (
        <section className="container-page py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Where to next</p>
                <h2 className="mt-2 text-balance font-display text-4xl font-semibold">
                  Featured destinations
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/destinations">
                  All destinations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {home.featuredDestinations
                .slice(0, 6)
                .map((destination, index) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    priority={index < 3}
                  />
                ))}
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* ── Trending packages ────────────────────────────── */}
      {home?.trendingPackages?.length ? (
        <section className="bg-parchment/60 py-16">
          <div className="container-page">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Ready to book</p>
                  <h2 className="mt-2 text-balance font-display text-4xl font-semibold">
                    Trending packages
                  </h2>
                </div>
                <Button asChild variant="outline">
                  <Link href="/packages">
                    All packages
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {home.trendingPackages.slice(0, 6).map((pkg, index) => (
                  <PackageCard
                    key={pkg.id}
                    package={pkg}
                    priority={index < 3}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ── Testimonials ─────────────────────────────────── */}
      {home?.testimonials?.length ? (
        <section className="container-page py-16">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">From the road</p>
            <h2 className="mt-2 text-balance font-display text-4xl font-semibold">
              Travelers, in their words
            </h2>
          </Reveal>
          <TestimonialRow testimonials={home.testimonials} />
        </section>
      ) : null}

      {/* ── Why Atlas ────────────────────────────────────── */}
      <section className="bg-parchment/60 py-16">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Atlas</p>
            <h2 className="mt-2 text-balance font-display text-4xl font-semibold">
              Built the way we would want to book
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Every trip is hand-verified",
                body: "No destination or package goes live until one of our team has taken the route, or a trusted local operator has run it with us on the ground.",
              },
              {
                icon: Compass,
                title: "Pricing with no footnotes",
                body: "What you see is what you pay: inclusions, exclusions and departure dates spelled out before you send a single message.",
              },
              {
                icon: HeartHandshake,
                title: "A person answers, always",
                body: "Enquiries land with a travel designer who knows the itinerary — not a queue. We reply within one working day, usually much sooner.",
              },
            ].map((value, index) => (
              <Reveal key={value.title} delay={index * 0.08}>
                <Card className="h-full p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <value.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {value.body}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className="container-page pb-8">
        <Reveal>
          <Card className="relative overflow-hidden bg-midnight text-on-dark">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-glacier/15 blur-3xl" />
            <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:p-14">
              <div>
                <p className="eyebrow text-on-dark-muted">The dispatch</p>
                <h2 className="mt-3 text-balance font-display text-3xl font-semibold sm:text-4xl">
                  Quiet-season fares, new routes, and where we are headed next.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-on-dark-muted">
                  One email a month. No countdown timers, no fake scarcity —
                  just places worth going and the dates that make them
                  affordable.
                </p>
              </div>
              <NewsletterForm tone="dark" source="home" />
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ── Empty state (API down) ───────────────────────── */}
      {!home ? (
        <section className="container-page py-24 text-center">
          <Rating value={0} className="sr-only" />
          <h2 className="font-display text-2xl font-semibold">
            Content is unavailable right now
          </h2>
          <p className="mt-2 text-ink-muted">
            The API did not respond. Start it with <code>npm run dev</code> and
            reload.
          </p>
        </section>
      ) : null}
    </>
  );
}
