import type { ServerRoute } from '@hapi/hapi'
import Joi from '@hapi/joi'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { newsletterSubscriptions } from '../../db/schema/index.js'
import { subscribeNewsletterPayload } from '../../validation/schemas.js'
import { ok } from '../../utils/api-response.js'
import { RATE_LIMITS, enforceRateLimit } from '../../services/rate-limit.js'
import { emailService } from '../../services/email.js'
import { logger } from '../../utils/logger.js'

export const newsletterRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/api/v1/newsletter/subscribe',
    options: {
      description: 'Subscribe an address to the Atlas dispatch',
      tags: ['api', 'newsletter'],
      validate: { payload: subscribeNewsletterPayload },
    },
    handler: async (request) => {
      enforceRateLimit(
        request.info.remoteAddress,
        'newsletter-subscribe',
        RATE_LIMITS.publicSubmission,
      )

      const { email, source } = request.payload as { email: string; source?: string }
      const normalisedEmail = email.trim().toLowerCase()

      const existing = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, normalisedEmail))
        .limit(1)

      const current = existing[0]

      if (current && current.status === 'subscribed') {
        return ok({ subscribed: true, alreadySubscribed: true })
      }

      if (current) {
        await db
          .update(newsletterSubscriptions)
          .set({ status: 'subscribed', source: source ?? current.source, unsubscribedAt: null })
          .where(eq(newsletterSubscriptions.id, current.id))
      } else {
        await db.insert(newsletterSubscriptions).values({
          email: normalisedEmail,
          status: 'subscribed',
          source: source ?? 'site',
        })
      }

      emailService
        .sendNewsletterWelcome(normalisedEmail)
        .catch((error) => logger.error({ err: error }, 'Newsletter welcome email failed'))

      return ok({ subscribed: true, alreadySubscribed: false })
    },
  },
  {
    method: 'POST',
    path: '/api/v1/newsletter/unsubscribe',
    options: {
      description: 'Unsubscribe an address from the Atlas dispatch',
      tags: ['api', 'newsletter'],
      validate: {
        payload: Joi.object({ email: Joi.string().email({ tlds: { allow: false } }).required() }),
      },
    },
    handler: async (request) => {
      const { email } = request.payload as { email: string }
      const normalisedEmail = email.trim().toLowerCase()

      const existing = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, normalisedEmail))
        .limit(1)

      if (!existing.length) return ok({ unsubscribed: true, existed: false })

      await db
        .update(newsletterSubscriptions)
        .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
        .where(eq(newsletterSubscriptions.id, existing[0].id))

      return ok({ unsubscribed: true, existed: true })
    },
  },
]
