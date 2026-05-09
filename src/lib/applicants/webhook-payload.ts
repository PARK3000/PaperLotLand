import type { ApplicantSubmission, ApplicantWebhookPayload } from './types'

export function buildApplicantWebhookPayload(
  applicationId: string,
  data: ApplicantSubmission
): ApplicantWebhookPayload {
  const nameParts = data.fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return {
    application_id: applicationId,
    full_name: data.fullName,
    first_name: firstName,
    last_name: lastName,
    phone: data.phone,
    email: data.email,
    position: data.position,
    intro_video_url: data.introVideoUrl || '',
    resume_url: data.resumeUrl || '',
    source: data.source,
    page_url: data.pageUrl || '',
    ip: data.ip || '',
    user_agent: data.userAgent || '',
    submitted_at: new Date().toISOString(),
    form_name: 'Applicant Form',
    has_drivers_license: data.hasDriversLicense || '',
    health_benefits_required: data.healthBenefitsRequired || '',
    can_work_in_office: data.canWorkInOffice || '',
    has_real_estate_license: data.hasRealEstateLicense || '',
    motivation: data.motivation || '',
    looking_for: data.lookingFor || '',
    team_contribution: data.teamContribution || '',
    utm_source: data.utm_source || '',
    utm_medium: data.utm_medium || '',
    utm_campaign: data.utm_campaign || '',
    utm_term: data.utm_term || '',
    utm_content: data.utm_content || '',
  }
}
