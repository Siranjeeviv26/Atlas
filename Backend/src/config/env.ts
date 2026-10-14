import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

loadDotenv()


const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => value === true || value === 'true' || value === '1')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),

  API_URL: z.string().url().default('http://localhost:4000'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters'),
  BETTER_AUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Atlas Travel <onboarding@resend.dev>'),

  ADMIN_EMAIL: z.string().email().default('admin@atlas.travel'),
  ADMIN_PASSWORD: z.string().min(10).default('ChangeMe!Admin123'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  TRUST_PROXY: booleanish.default(false),
})

export type Env = z.infer<typeof envSchema>

function readEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  return parsed.data
}

export const env = readEnv()

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

/** Absolute base URL of this API server. */
export const apiUrl = env.BETTER_AUTH_URL ?? env.API_URL

/** Origins allowed to call the API with credentials (CORS + Better Auth trusted origins). */
export const allowedOrigins = Array.from(
  new Set(
    [
      env.APP_URL,
      env.API_URL,
      ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean),
  ),
)

export const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
)

export const resendConfigured = Boolean(env.RESEND_API_KEY)

export const googleOAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
