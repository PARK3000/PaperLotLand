/**
 * Shared Google auth for GA4 + GSC API calls.
 * Reads service account credentials from GOOGLE_SERVICE_ACCOUNT_B64 env var.
 */

import { google } from 'googleapis'

let _auth: InstanceType<typeof google.auth.JWT> | null = null

export function getGoogleAuth() {
  if (_auth) return _auth

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64
  if (!b64) throw new Error('GOOGLE_SERVICE_ACCOUNT_B64 env var is not set')

  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))

  _auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  })

  return _auth
}
