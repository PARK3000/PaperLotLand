import { getDb } from '@/lib/db'
import type { ApplicantWebhookPayload, ApplicantStatus } from './types'

interface LogApplicantParams {
  applicationId: string
  status: ApplicantStatus
  payload: ApplicantWebhookPayload
  errorMessage?: string
}

export async function logApplicant(params: LogApplicantParams): Promise<void> {
  try {
    const sql = getDb()
    await sql`
      INSERT INTO applicants (
        application_id, status,
        full_name, phone, email,
        position, intro_video_url, resume_url, source,
        payload, page_url, ip, user_agent, error_message,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      ) VALUES (
        ${params.applicationId},
        ${params.status},
        ${params.payload.full_name},
        ${params.payload.phone},
        ${params.payload.email},
        ${params.payload.position},
        ${params.payload.intro_video_url},
        ${params.payload.resume_url},
        ${params.payload.source},
        ${JSON.stringify(params.payload)},
        ${params.payload.page_url},
        ${params.payload.ip},
        ${params.payload.user_agent},
        ${params.errorMessage || null},
        ${params.payload.utm_source},
        ${params.payload.utm_medium},
        ${params.payload.utm_campaign},
        ${params.payload.utm_term},
        ${params.payload.utm_content}
      )
      ON CONFLICT (application_id) DO UPDATE SET
        status        = EXCLUDED.status,
        error_message = EXCLUDED.error_message,
        updated_at    = NOW()
    `
  } catch (err) {
    console.error('[applicants/db-logger] DB write failed:', err)
    throw err
  }
}
