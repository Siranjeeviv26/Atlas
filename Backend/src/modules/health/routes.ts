import type { ServerRoute } from '@hapi/hapi'
import { sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { emailService } from '../../services/email.js'
import { cloudinaryConfigured } from '../../config/env.js'
import { ok } from '../../utils/api-response.js'

const startedAt = Date.now()

export const healthRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/health',
    options: {
      description: 'Liveness probe — never touches the database',
      tags: ['api', 'health'],
      cache: false,
    },
    handler: () =>
      ok({
        status: 'ok',
        service: 'atlas-api',
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        timestamp: new Date().toISOString(),
      }),
  },
  {
    method: 'GET',
    path: '/api/v1/health/ready',
    options: {
      description: 'Readiness probe — verifies database connectivity and provider config',
      tags: ['api', 'health'],
      cache: false,
    },
    handler: async () => {
      let database: 'up' | 'down' = 'down'
      let latencyMs: number | null = null

      const started = Date.now()
      try {
        await db.execute(sql`select 1`)
        database = 'up'
        latencyMs = Date.now() - started
      } catch {
        database = 'down'
      }

      const ready = database === 'up'

      return ok({
        status: ready ? 'ready' : 'degraded',
        checks: {
          database: { status: database, latencyMs },
          email: { status: emailService.isEnabled() ? 'configured' : 'unconfigured' },
          uploads: { status: cloudinaryConfigured ? 'configured' : 'unconfigured' },
        },
        timestamp: new Date().toISOString(),
      })
    },
  },
]
