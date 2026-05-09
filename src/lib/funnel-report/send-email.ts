/**
 * Send an email via Resend REST API (no extra dependency needed).
 * https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API = 'https://api.resend.com/emails'

interface SendEmailParams {
  to: string
  from: string
  subject: string
  html: string
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY env var is not set')

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }

  return res.json()
}
