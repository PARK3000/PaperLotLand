/**
 * Chat API — Casey AI persona powered by Claude Haiku.
 *
 * Receives the full conversation history, calls claude-haiku-4-5,
 * and returns the assistant reply plus lead-ready signal when
 * name + phone + email + interest have all been collected.
 *
 * Rate limit: 30 messages per session token, 5 session tokens per IP/hour.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { redis } from '@/lib/redis'

// ── Types ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts?: number
  attachmentUrl?: string
  attachmentName?: string
  attachmentKind?: 'image' | 'document'
}

interface ChatRequest {
  messages: ChatMessage[]
  sessionToken: string
  pageUrl?: string
}

interface ChatResponse {
  reply: string
  leadReady?: boolean
  extractedFields?: {
    name?: string
    phone?: string
    email?: string
    address?: string
    timeline?: string
  }
}

// ── Rate limiting ──────────────────────────────────────────────────────────

const MSG_MAX = 30        // max messages per session token
const SESSION_MAX = 10    // max session tokens per IP per hour
const SESSION_TTL = 3600  // 1 hour

async function checkRateLimit(ip: string, sessionToken: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    // Per-session message limit
    const msgKey = `rl:chat:msg:${sessionToken}`
    const msgCount = await redis.incr(msgKey)
    if (msgCount === 1) await redis.expire(msgKey, SESSION_TTL)
    if (msgCount > MSG_MAX) return { blocked: true, reason: 'session_limit' }

    // Per-IP session limit (only increment on first message in a session)
    if (msgCount === 1) {
      const ipKey = `rl:chat:ip:${ip}`
      const ipCount = await redis.incr(ipKey)
      if (ipCount === 1) await redis.expire(ipKey, SESSION_TTL)
      if (ipCount > SESSION_MAX) return { blocked: true, reason: 'ip_limit' }
    }

    return { blocked: false }
  } catch {
    // Redis down — fail open
    return { blocked: false }
  }
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Casey, a land specialist at PaperLotLand — a private off-market land network in the Las Vegas Valley. You connect developers, brokers, and investors with land deals that never hit the public market.

Your only goal is to collect the user's name, email, phone, and what they are looking for (buying land, selling land, or both). Be concise, professional, and helpful.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLECTION ORDER — follow these steps in order, one at a time:
STEP 1: What they are looking for (buying land, selling land, or both)
STEP 2: Name
STEP 3: Email
STEP 4: Phone number
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSE LENGTH RULES:
- Maximum 1–2 SHORT sentences per reply.
- Answer briefly, then immediately ask for the next piece of info.
- Think: text message, not email.

EXAMPLE FLOWS:

User: "I have land to sell"
Casey: "Great — we work with sellers all the time. What's your name?"

User: "I'm looking for land deals"
Casey: "You're in the right place. Are you primarily buying, selling, or both?"

User: "How does the network work?"
Casey: "We share off-market parcels before they hit MLS. What are you looking for — buying, selling, or both?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE (use only if directly asked):
- Service area? "Clark County and surrounding Southern Nevada."
- Contact? "(702) 465-6111 or parkergibbons1@gmail.com"
- Privacy? "We never share your info."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Do not mention AI, chatbot, or Claude.
- Never break character. You are Casey, a real person.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD-READY SIGNAL — output ONCE after you have collected name, email, and phone:
LEAD_READY:{"name":"<full name>","phone":"<digits only>","email":"<email or empty string>","address":"","timeline":"<buying/selling/both>"}
No markdown. No code block. On its own line.`

// ── Anthropic client ───────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown'

  // Parse body
  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, sessionToken, pageUrl: _pageUrl } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length > 128) {
    return NextResponse.json({ error: 'Invalid sessionToken' }, { status: 400 })
  }

  // Rate limit
  const { blocked, reason } = await checkRateLimit(ip, sessionToken)
  if (blocked) {
    const msg = reason === 'session_limit'
      ? 'Our chat has a message limit per session. Please give us a call at (702) 465-6111!'
      : 'Too many chats from your connection. Please give us a call at (702) 465-6111!'
    return NextResponse.json({ reply: msg }, { status: 200 }) // Return gracefully, not 429
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Chat] ANTHROPIC_API_KEY not set')
    return NextResponse.json({ error: 'Chat service unavailable' }, { status: 503 })
  }

  // Sanitize and trim message history (last 20 messages to stay within token limits)
  const sanitized: Anthropic.MessageParam[] = messages
    .slice(-20)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).slice(0, 1000),
    }))

  // Ensure last message is from user
  if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
  }

  try {
    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: sanitized,
    })

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    // Extract LEAD_READY signal if present
    // Match greedy to capture nested quotes in address values
    const leadMatch = rawText.match(/LEAD_READY:(\{[\s\S]*?\})/)
    let leadReady = false
    let extractedFields: ChatResponse['extractedFields'] = undefined
    let cleanReply = rawText

    if (leadMatch) {
      try {
        extractedFields = JSON.parse(leadMatch[1])
        leadReady = !!(extractedFields?.name && extractedFields?.phone && extractedFields?.address)
      } catch {
        // Malformed JSON from model — ignore the signal
      }
      // Strip the LEAD_READY line from the visible reply
      cleanReply = rawText.replace(/\n?LEAD_READY:\{[\s\S]*?\}/, '').trim()
    }

    return NextResponse.json({
      reply: cleanReply,
      leadReady: leadReady || undefined,
      extractedFields: leadReady ? extractedFields : undefined,
    })
  } catch (err) {
    console.error('[Chat] Anthropic API error:', err)
    return NextResponse.json(
      { error: 'Chat service temporarily unavailable' },
      { status: 503 },
    )
  }
}
