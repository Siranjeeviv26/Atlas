import pino from 'pino'
import { env, isTest } from '../config/env.js'

export const logger = pino({
  level: env.LOG_LEVEL ?? (isTest ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { service: 'atlas-api', env: env.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'body.password',
      'body.newPassword',
      'body.confirmPassword',
      'apiKey',
      'api_secret',
    ],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export type Logger = typeof logger
