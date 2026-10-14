import type { ServerRoute } from '@hapi/hapi'
import { eq } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { destinations, destinationImages, travelPackages, packageImages } from '../../../db/schema/index.js'
import { serverUploadPayload, uploadSignaturePayload } from '../../../validation/schemas.js'
import { ok } from '../../../utils/api-response.js'
import { notFound } from '../../../utils/errors.js'
import { requireAdmin } from '../../../plugins/request-context.js'
import { RATE_LIMITS, enforceRateLimit } from '../../../services/rate-limit.js'
import {
  createUploadSignature,
  uploadImageBuffer,
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME_TYPES,
} from '../../../services/cloudinary.js'

export const adminUploadRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/admin/uploads/policy',
    options: {
      description: 'Upload constraints the admin UI should enforce',
      tags: ['api', 'admin', 'uploads'],
    },
    handler: async (request) => {
      await requireAdmin(request)
      return ok({
        maxBytes: MAX_UPLOAD_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        directUploadEnabled: true,
      })
    },
  },
  {
    method: 'POST',
    path: '/api/v1/admin/uploads/signature',
    options: {
      description: 'Signed upload payload so the browser can upload straight to Cloudinary',
      tags: ['api', 'admin', 'uploads'],
      validate: { payload: uploadSignaturePayload },
    },
    handler: async (request) => {
      await requireAdmin(request)
      enforceRateLimit(request.info.remoteAddress, 'admin-signature', RATE_LIMITS.uploads)

      const { folder, fileName } = request.payload as { folder?: string; fileName?: string }
      const signature = createUploadSignature({ folder: folder ?? 'atlas/destinations' })

      return ok({ ...signature, originalFileName: fileName ?? null })
    },
  },
  {
    method: 'POST',
    path: '/api/v1/admin/uploads',
    options: {
      description: 'Server-side image upload (base64 data URL), optionally attached to an entity',
      tags: ['api', 'admin', 'uploads'],
      validate: { payload: serverUploadPayload },
      payload: {
        maxBytes: 16 * 1024 * 1024, // base64 overhead over the 10 MB image limit
      },
    },
    handler: async (request) => {
      await requireAdmin(request)
      enforceRateLimit(request.info.remoteAddress, 'admin-upload', RATE_LIMITS.uploads)

      const payload = request.payload as {
        dataUrl: string
        folder?: string
        fileName?: string
        alt?: string
        isHero?: boolean
        entity_type?: 'destination' | 'package'
        entity_id?: string
      }

      const upload = await uploadImageBuffer({
        base64: payload.dataUrl,
        folder: payload.folder ?? 'atlas/destinations',
        fileName: payload.fileName,
      })

      const alt = payload.alt?.trim() || payload.fileName || 'Uploaded image'
      let attachedTo: { type: string; id: string } | null = null

      if (payload.entity_type && payload.entity_id) {
        await attachToEntity(payload.entity_type, payload.entity_id, {
          url: upload.secureUrl,
          publicId: upload.publicId,
          alt,
          isHero: Boolean(payload.isHero),
        })
        attachedTo = { type: payload.entity_type, id: payload.entity_id }
      }

      return ok({ upload, attachedTo })
    },
  },
]

async function attachToEntity(
  entityType: 'destination' | 'package',
  entityId: string,
  image: { url: string; publicId: string; alt: string; isHero: boolean },
): Promise<void> {
  if (entityType === 'destination') {
    const rows = await db
      .select({ id: destinations.id })
      .from(destinations)
      .where(eq(destinations.id, entityId))
      .limit(1)
    if (!rows.length) throw notFound('That destination does not exist.')

    if (image.isHero) {
      await db.update(destinations).set({
        heroImageUrl: image.url,
        heroImagePublicId: image.publicId,
      }).where(eq(destinations.id, entityId))
      await db
        .update(destinationImages)
        .set({ isHero: false })
        .where(eq(destinationImages.destinationId, entityId))
    }

    await db.insert(destinationImages).values({
      destinationId: entityId,
      url: image.url,
      publicId: image.publicId,
      alt: image.alt,
      isHero: image.isHero,
    })
    return
  }

  const rows = await db
    .select({ id: travelPackages.id })
    .from(travelPackages)
    .where(eq(travelPackages.id, entityId))
    .limit(1)
  if (!rows.length) throw notFound('That package does not exist.')

  if (image.isHero) {
    await db.update(travelPackages).set({
      heroImageUrl: image.url,
      heroImagePublicId: image.publicId,
    }).where(eq(travelPackages.id, entityId))
    await db
      .update(packageImages)
      .set({ isHero: false })
      .where(eq(packageImages.packageId, entityId))
  }

  await db.insert(packageImages).values({
    packageId: entityId,
    url: image.url,
    publicId: image.publicId,
    alt: image.alt,
    isHero: image.isHero,
  })
}
