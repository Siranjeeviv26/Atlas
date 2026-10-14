import { Resend } from 'resend'
import { env, resendConfigured } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { emailTemplates, renderBrandEmail } from './email-templates.js'

let client: Resend | null = null

function getClient(): Resend | null {
  if (!resendConfigured) return null
  if (!client) client = new Resend(env.RESEND_API_KEY)
  return client
}

export interface SendResult {
  delivered: boolean
  /** Populated when the provider is not configured (dev fallback). */
  preview?: string
}

async function send(
  to: string,
  subject: string,
  html: string,
  options: { tags?: Array<{ name: string; value: string }> } = {},
): Promise<SendResult> {
  const resend = getClient()

  if (!resend) {
    logger.warn(
      { to, subject },
      'RESEND_API_KEY is not configured — logging email instead of sending it',
    )
    return { delivered: false, preview: html }
  }

  try {
    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      ...(options.tags ? { tags: options.tags } : {}),
    })

    if (response.error) {
      logger.error({ to, subject, error: response.error }, 'Resend rejected the message')
      return { delivered: false }
    }

    logger.info({ to, subject, id: response.data?.id }, 'Email sent')
    return { delivered: true }
  } catch (error) {
    logger.error({ err: error, to, subject }, 'Failed to send email')
    return { delivered: false }
  }
}

export const emailService = {
  isEnabled: () => resendConfigured,

  async sendWelcome(to: string, name: string): Promise<SendResult> {
    const template = emailTemplates.welcome(name)
    return send(to, 'Welcome to Atlas — your travel account is ready', renderBrandEmail(template), {
      tags: [{ name: 'category', value: 'welcome' }],
    })
  },

  async sendVerification(to: string, name: string, url: string): Promise<SendResult> {
    const template = emailTemplates.verification(name, url)
    return send(to, 'Verify your Atlas email address', renderBrandEmail(template), {
      tags: [{ name: 'category', value: 'verification' }],
    })
  },

  async sendPasswordReset(to: string, name: string, url: string): Promise<SendResult> {
    const template = emailTemplates.resetPassword(name, url)
    return send(to, 'Reset your Atlas password', renderBrandEmail(template), {
      tags: [{ name: 'category', value: 'password-reset' }],
    })
  },

  async sendEnquiryAcknowledgement(
    to: string,
    name: string,
    subject: string,
  ): Promise<SendResult> {
    const template = emailTemplates.enquiryReceived(name, subject)
    return send(to, `We received your enquiry: ${subject}`, renderBrandEmail(template), {
      tags: [{ name: 'category', value: 'enquiry' }],
    })
  },

  async sendNewsletterWelcome(to: string): Promise<SendResult> {
    const template = emailTemplates.newsletterWelcome()
    return send(to, 'You are subscribed to the Atlas dispatch', renderBrandEmail(template), {
      tags: [{ name: 'category', value: 'newsletter' }],
    })
  },
}
