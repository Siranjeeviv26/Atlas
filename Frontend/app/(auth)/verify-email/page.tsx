import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth-layout'

export const metadata = {
  title: 'Verify your email',
}

/**
 * Landing page for verification links and the resend-verification endpoint.
 * The actual token exchange happens on the API (`/api/auth/verify-email`);
 * this page tells the user what to do next.
 */
export default function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="One last step"
      heading="Verify your email"
      subheading="Open the link we just sent — it activates your account and signs you straight in."
      image="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80"
    >
      <div className="mt-8 rounded-2xl border border-sand bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10">
            <MailCheck className="h-5 w-5 text-teal-dark" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Link expires in 24 hours</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              Nothing in your inbox? Check spam, or resend it from{' '}
              <Link href="/account" className="font-medium text-teal-dark underline-offset-4 hover:underline">
                your account
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <Button asChild variant="outline" className="mt-5 w-full">
        <Link href="/">Back home</Link>
      </Button>
    </AuthLayout>
  )
}
