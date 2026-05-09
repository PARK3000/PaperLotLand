/**
 * Shared constants for the lead generation pipeline.
 * Single source of truth — used by /api/leads, /api/leads/stream, and /api/cron/abandoned-leads.
 */

export const PODIO_FALLBACK_URL = process.env.PODIO_FALLBACK_URL || ''

export const PODIO_FULL_SUBMIT_URL = process.env.PODIO_FULL_SUBMIT_URL || ''

/** Default fetch timeout for outgoing webhook calls (ms). */
export const WEBHOOK_TIMEOUT_MS = 5_000
