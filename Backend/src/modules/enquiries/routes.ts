import type { ServerRoute } from '@hapi/hapi'
import Joi from '@hapi/joi'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { travelEnquiries, destinations, travelPackages } from '../../db/schema/index.js'
import { createEnquiryPayload, listEnquiriesQuery } from '../../validation/schemas.js'
import { buildPaginationMeta, ok, paginated } from '../../utils/api-response.js'
import { normalisePagination } from '../../utils/pagination.js'
import { RATE_LIMITS, enforceRateLimit } from '../../services/rate-limit.js'
import { notFound, unauthorized } from '../../utils/errors.js'
import { emailService } from '../../services/email.js'
import { resolveRequestUser } from '../../plugins/request-context.js'
import { logger } from '../../utils/logger.js'
import { findDestinationIdBySlug } from '../destinations/repository.js'
import { findPackageIdBySlug } from '../packages/repository.js'

function serializeEnquiry(
  row: typeof travelEnquiries.$inferSelect & {
    destinationName?: string | null
    packageTitle?: string | null
  },
) {
  return {
    id: row.id,
    subject: row.subject,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    travellers: row.travellers,
    budgetCents: row.budgetCents,
    travelDate: row.travelDate ? row.travelDate.toISOString() : null,
    destinationName: row.destinationName ?? null,
    packageTitle: row.packageTitle ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const enquiryRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/api/v1/enquiries',
    options: {
      description: 'Submit a travel enquiry (public, rate limited)',
      tags: ['api', 'enquiries'],
      validate: { payload: createEnquiryPayload },
    },
    handler: async (request, h) => {
      enforceRateLimit(request.info.remoteAddress, 'enquiry-submit', RATE_LIMITS.publicSubmission)

      const payload = request.payload as {
        name: string
        email: string
        phone?: string
        subject: string
        message: string
        destinationSlug?: string
        packageSlug?: string
        travelDate?: string | null
        budgetCents?: number | null
        travellers?: number
      }

      const sessionUser = await resolveRequestUser(request)

      let destinationId: string | null = null
      let packageId: string | null = null

      if (payload.destinationSlug) {
        destinationId = await findDestinationIdBySlug(payload.destinationSlug)
      }
      if (payload.packageSlug) {
        packageId = await findPackageIdBySlug(payload.packageSlug)
      }

      const inserted = await db
        .insert(travelEnquiries)
        .values({
          userId: sessionUser?.id ?? null,
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          subject: payload.subject,
          message: payload.message,
          destinationId,
          packageId,
          travelDate: payload.travelDate ? new Date(payload.travelDate) : null,
          budgetCents: payload.budgetCents ?? null,
          travellers: payload.travellers ?? 1,
          status: 'pending',
        })
        .returning()

      const enquiry = inserted[0]

      // Fire-and-forget the acknowledgement so a provider hiccup never fails the request.
      emailService
        .sendEnquiryAcknowledgement(payload.email, payload.name, payload.subject)
        .catch((error) => logger.error({ err: error }, 'Enquiry acknowledgement failed'))

      return h
        .response(
          ok({
            id: enquiry.id,
            status: enquiry.status,
            createdAt: enquiry.createdAt.toISOString(),
          }),
        )
        .code(201)
    },
  },
  {
    method: 'GET',
    path: '/api/v1/enquiries',
    options: {
      description: 'Enquiry history for the signed-in user',
      tags: ['api', 'enquiries'],
      validate: { query: listEnquiriesQuery },
    },
    handler: async (request) => {
      const sessionUser = await resolveRequestUser(request)
      if (!sessionUser) {
        return paginated([], buildPaginationMeta(1, 10, 0), { requiresAuth: true })
      }

      const query = request.query as { page?: number; limit?: number; status?: string }
      const { page, limit, offset } = normalisePagination(query.page, query.limit, 10)

      const where = query.status
        ? and(eq(travelEnquiries.userId, sessionUser.id), eq(travelEnquiries.status, query.status))
        : eq(travelEnquiries.userId, sessionUser.id)

      const [rows, totalRows] = await Promise.all([
        db
          .select({
            enquiry: travelEnquiries,
            destinationName: destinations.name,
            packageTitle: travelPackages.title,
          })
          .from(travelEnquiries)
          .leftJoin(destinations, eq(travelEnquiries.destinationId, destinations.id))
          .leftJoin(travelPackages, eq(travelEnquiries.packageId, travelPackages.id))
          .where(where)
          .orderBy(desc(travelEnquiries.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(travelEnquiries).where(where),
      ])

      const items = rows.map((row) =>
        serializeEnquiry({
          ...row.enquiry,
          destinationName: row.destinationName,
          packageTitle: row.packageTitle,
        }),
      )

      return paginated(items, buildPaginationMeta(page, limit, totalRows[0]?.count ?? 0))
    },
  },
  {
    method: 'GET',
    path: '/api/v1/enquiries/{id}',
    options: {
      description: 'Single enquiry detail for the signed-in user',
      tags: ['api', 'enquiries'],
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
      },
    },
    handler: async (request) => {
      const sessionUser = await resolveRequestUser(request)
      if (!sessionUser) throw unauthorized('You must be signed in to view enquiries.')

      const { id } = request.params as { id: string }
      const rows = await db
        .select({
          enquiry: travelEnquiries,
          destinationName: destinations.name,
          packageTitle: travelPackages.title,
        })
        .from(travelEnquiries)
        .leftJoin(destinations, eq(travelEnquiries.destinationId, destinations.id))
        .leftJoin(travelPackages, eq(travelEnquiries.packageId, travelPackages.id))
        .where(and(eq(travelEnquiries.id, id), eq(travelEnquiries.userId, sessionUser.id)))
        .limit(1)

      const row = rows[0]
      if (!row) throw notFound('That enquiry could not be found.')

      return ok(
        serializeEnquiry({
          ...row.enquiry,
          destinationName: row.destinationName,
          packageTitle: row.packageTitle,
        }),
      )
    },
  },
]
