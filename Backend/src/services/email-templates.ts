export interface BrandEmailInput {
  eyebrow: string
  heading: string
  intro: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  footerNote?: string
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#4A5568;font-size:15px;line-height:1.7;">${escapeHtml(text)}</p>`
}

/** Branded, table-based HTML that renders reliably across mail clients. */
export function renderBrandEmail(input: BrandEmailInput): string {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
           <tr>
             <td style="border-radius:10px;background:linear-gradient(135deg,#0F2A44,#123A56);">
               <a href="${escapeHtml(input.ctaHref)}"
                  style="display:inline-block;padding:13px 26px;color:#F7F4EE;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;font-family:${FONT_STACK};">
                  ${escapeHtml(input.ctaLabel)}
               </a>
             </td>
           </tr>
         </table>`
      : ''

  const bodyCopy = input.body ? paragraph(input.body) : ''

  const footer = input.footerNote
    ? `<p style="margin:20px 0 0;color:#8A94A6;font-size:12px;line-height:1.6;">${escapeHtml(input.footerNote)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#F2F0EB;font-family:${FONT_STACK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0EB;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E7E2D8;">
          <tr>
            <td style="background:#0B1220;padding:26px 32px;">
              <span style="font-family:${FONT_STACK};font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#7DD3E8;font-weight:600;">Atlas</span>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 38px;">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1FA8A0;font-weight:600;">${escapeHtml(input.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-family:${FONT_STACK};font-size:26px;line-height:1.25;color:#0B1220;font-weight:700;">${escapeHtml(input.heading)}</h1>
              ${paragraph(input.intro)}
              ${bodyCopy}
              ${cta}
              ${footer}
            </td>
          </tr>
          <tr>
            <td style="background:#F7F4EE;padding:22px 32px;border-top:1px solid #E7E2D8;">
              <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;font-family:${FONT_STACK};">
                Atlas · Premium travel discovery &amp; trip planning<br/>
                You are receiving this because an Atlas account or enquiry uses this address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const emailTemplates = {
  welcome: (name: string) => ({
    eyebrow: 'Welcome aboard',
    heading: `Welcome to Atlas, ${name.split(' ')[0] || 'traveller'}.`,
    intro:
      'Your account is ready. Save the destinations that move you, follow curated journeys, and send trip enquiries directly to our travel designers.',
    ctaLabel: 'Explore destinations',
    ctaHref: process.env.APP_URL ? `${process.env.APP_URL}/destinations` : '/destinations',
    footerNote: 'Reply to this email any time — a real person reads every message.',
  }),

  verification: (name: string, url: string) => ({
    eyebrow: 'Verify your email',
    heading: 'Confirm your address to continue.',
    intro: `Hi ${name.split(' ')[0] || 'there'}, confirm this email address to secure your Atlas account and start saving trips.`,
    body: 'This link expires shortly. If you did not create an Atlas account, you can safely ignore this email.',
    ctaLabel: 'Verify email address',
    ctaHref: url,
  }),

  resetPassword: (name: string, url: string) => ({
    eyebrow: 'Password reset',
    heading: 'Reset your Atlas password.',
    intro: `Hi ${name.split(' ')[0] || 'there'}, we received a request to reset the password for your Atlas account.`,
    body: 'This link can only be used once and expires soon. If you did not request this, no action is needed — your password stays unchanged.',
    ctaLabel: 'Choose a new password',
    ctaHref: url,
  }),

  enquiryReceived: (name: string, subject: string) => ({
    eyebrow: 'Enquiry received',
    heading: 'A travel designer will be in touch.',
    intro: `Thanks ${name.split(' ')[0] || 'there'} — we received your enquiry about "${subject}".`,
    body: 'Our team typically responds within one business day with tailored options, pricing and availability.',
    ctaLabel: 'View your enquiries',
    ctaHref: process.env.APP_URL ? `${process.env.APP_URL}/account/enquiries` : '/account/enquiries',
  }),

  newsletterWelcome: () => ({
    eyebrow: 'Newsletter',
    heading: 'You are on the list.',
    intro:
      'Expect a monthly dispatch: newly curated destinations, seasonal windows worth flying for, and journeys our designers are excited about.',
    ctaLabel: 'Browse destinations',
    ctaHref: process.env.APP_URL ? `${process.env.APP_URL}/destinations` : '/destinations',
  }),
}
