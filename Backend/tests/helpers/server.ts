import { buildServer } from '../../src/app.js'
import type Hapi from '@hapi/hapi'

let server: Hapi.Server | undefined

export async function getServer(): Promise<Hapi.Server> {
  if (!server) {
    server = await buildServer()
    await server.initialize()
  }
  return server
}

export async function closeServer(): Promise<void> {
  if (server) {
    await server.stop({ timeout: 0 })
    server = undefined
  }
}

/** Extracts every Set-Cookie name=value pair from an inject result. */
export function sessionCookies(headers: Record<string, unknown>): string[] {
  const raw = headers['set-cookie']
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : [raw]
  return list.map((cookie) => String(cookie).split(';')[0])
}
