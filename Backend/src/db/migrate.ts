import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, sql } from './index.js'
import { logger } from '../utils/logger.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_FOLDER = path.resolve(here, '../../drizzle')

export async function runMigrations(): Promise<void> {
  logger.info({ folder: MIGRATIONS_FOLDER }, 'Running database migrations')
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  logger.info('Database migrations complete')
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isDirectRun) {
  runMigrations()
    .then(async () => {
      await sql.end({ timeout: 2 })
      process.exit(0)
    })
    .catch(async (error) => {
      logger.error({ err: error }, 'Migration failed')
      await sql.end({ timeout: 2 })
      process.exit(1)
    })
}
