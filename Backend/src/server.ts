import { buildServer } from './app.js'
import { env, allowedOrigins } from './config/env.js'
import { logger } from './utils/logger.js'
import { sql } from './db/index.js'
import { runMigrations } from './db/migrate.js'

async function bootstrap(): Promise<void> {
  if (env.NODE_ENV !== 'test' && process.env.SKIP_AUTO_MIGRATE !== 'true') {
    try {
      await runMigrations()
    } catch (error) {
      logger.error({ err: error }, 'Auto-migration failed — continuing with existing schema')
    }
  }

  const server = await buildServer()

  server.ext('onPreResponse', (request, h) => {
    // Ensure the auth proxy can set cross-origin cookies when the frontend
    // is served from a different origin than the API.
    const origin = request.headers.origin ? String(request.headers.origin) : undefined
    if (origin && allowedOrigins.includes(origin)) {
      const response = request.response as { header?: (k: string, v: string) => void }
      if (response && typeof response.header === 'function' && request.path.startsWith('/api/auth')) {
        response.header('access-control-allow-origin', origin)
        response.header('access-control-allow-credentials', 'true')
      }
    }
    return h.continue
  })

  await server.start()

  logger.info(
    {
      url: server.info.uri,
      env: env.NODE_ENV,
      trustedOrigins: allowedOrigins,
    },
    'Atlas API is running',
  )

  const shutdown = async (signal: string) => {
    logger.info({ msg: 'Shutting down Atlas API', signal })
    try {
      await server.stop({ timeout: 10_000 })
      await sql.end({ timeout: 3 })
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  process.on('unhandledRejection', (reason) => {
    logger.error({ msg: 'Unhandled promise rejection', err: reason })
  })
}

bootstrap().catch((error) => {
  logger.fatal({ msg: 'Failed to start Atlas API', err: error })
  process.exit(1)
})
