import { v2 as cloudinary } from 'cloudinary'
import { env, cloudinaryConfigured } from '../config/env.js'
import { payloadTooLarge, serviceUnavailable, badRequest } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export function assertCloudinaryConfigured(): void {
  if (!cloudinaryConfigured) {
    throw serviceUnavailable(
      'Image uploads are not configured on this server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
    )
  }
}

export function assertAllowedImage(value: {
  mimeType?: string
  sizeBytes?: number
}): AllowedMimeType {
  const mimeType = (value.mimeType ?? '').toLowerCase()
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw badRequest(
      `Unsupported file type "${mimeType || 'unknown'}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`,
      { field: 'file', allowed: ALLOWED_MIME_TYPES },
    )
  }

  const sizeBytes = value.sizeBytes ?? 0
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw payloadTooLarge(
      `Image is ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB. The maximum allowed size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
    )
  }

  return mimeType as AllowedMimeType
}

/** Delivery transformations reused by both uploads and stored image URLs. */
export const IMAGE_TRANSFORMATIONS = {
  card: { width: 800, height: 1000, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' },
  hero: { width: 1920, height: 1080, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' },
  gallery: { width: 1400, height: 933, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' },
} as const

export type ImagePreset = keyof typeof IMAGE_TRANSFORMATIONS

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  bytes: number
  format: string
}

/**
 * Generates the signature the browser needs to upload directly to Cloudinary.
 * The API secret never leaves the server.
 */
export function createUploadSignature(options: {
  folder?: string
  timestamp?: number
}): { signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string } {
  assertCloudinaryConfigured()

  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const folder = options.folder ?? 'atlas/uploads'

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    env.CLOUDINARY_API_SECRET as string,
  )

  return { signature, timestamp, apiKey: env.CLOUDINARY_API_KEY as string, cloudName: env.CLOUDINARY_CLOUD_NAME as string, folder }
}

/** Server-side upload used when the client posts base64 image data. */
export async function uploadImageBuffer(params: {
  base64: string
  folder?: string
  fileName?: string
}): Promise<UploadResult> {
  assertCloudinaryConfigured()

  const folder = params.folder ?? 'atlas/uploads'
  const mimeMatch = /^data:([a-zA-Z0-9/+.-]+);base64,/.exec(params.base64)
  if (!mimeMatch) {
    throw badRequest('Expected a base64 data URL, e.g. "data:image/jpeg;base64,..." .')
  }

  const mimeType = mimeMatch[1].toLowerCase()
  const base64Payload = params.base64.slice(mimeMatch[0].length)
  const sizeBytes = Math.floor((base64Payload.length * 3) / 4)

  assertAllowedImage({ mimeType, sizeBytes })

  try {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64Payload}`,
      {
        folder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        transformation: [IMAGE_TRANSFORMATIONS.gallery],
        ...(params.fileName ? { context: { alt: params.fileName } } : {}),
      },
    )

    const upload: UploadResult = {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    }

    logger.info({ publicId: upload.publicId, bytes: upload.bytes }, 'Cloudinary upload complete')
    return upload
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary upload failed')
    throw serviceUnavailable('The image could not be uploaded right now. Please try again.')
  }
}

export async function destroyImage(publicId: string): Promise<void> {
  if (!cloudinaryConfigured || !publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  } catch (error) {
    logger.warn({ err: error, publicId }, 'Failed to delete Cloudinary asset')
  }
}

/**
 * Builds a responsive, auto-format URL for a stored asset.
 * Works for both Cloudinary public IDs and already-absolute URLs.
 */
export function imageUrl(
  source: string | null | undefined,
  preset: ImagePreset = 'card',
): string | null {
  if (!source) return null
  if (/^https?:\/\//i.test(source) || source.startsWith('data:')) return source
  if (!cloudinaryConfigured) return source

  return cloudinary.url(source, {
    secure: true,
    ...IMAGE_TRANSFORMATIONS[preset],
  })
}
