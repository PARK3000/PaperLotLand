/**
 * Type definitions for the job applicant submission pipeline.
 * Completely separate from the seller lead forms/types.
 */

export interface ApplicantSubmission {
  fullName: string
  phone: string
  email: string
  position: string
  introVideoUrl?: string
  resumeUrl?: string
  source: string
  pageUrl?: string
  ip?: string
  userAgent?: string
  _hp?: string
  // Screening questions
  hasDriversLicense?: string
  healthBenefitsRequired?: string
  canWorkInOffice?: string
  hasRealEstateLicense?: string
  motivation?: string
  lookingFor?: string
  teamContribution?: string
  // UTM params (captured client-side via getTrackingParams)
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface ApplicantWebhookPayload {
  application_id: string
  full_name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  position: string
  intro_video_url: string
  resume_url: string
  source: string
  page_url: string
  ip: string
  user_agent: string
  submitted_at: string
  form_name: string
  // Screening questions
  has_drivers_license: string
  health_benefits_required: string
  can_work_in_office: string
  has_real_estate_license: string
  motivation: string
  looking_for: string
  team_contribution: string
  // UTM params
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
}

export type ApplicantStatus = 'delivered' | 'failed'
