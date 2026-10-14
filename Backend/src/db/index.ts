import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from './schema/index.js'

export type Database = ReturnType<typeof createDatabase>

function createDatabase() {
  const client = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === 'test' ? 4 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: true,
    onnotice: () => {},
  })

  const db = drizzle(client, { schema })
  return { client, db }
}

const singleton = createDatabase()

export const sql = singleton.client
export const db = singleton.db
export { schema }
