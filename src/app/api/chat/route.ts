/**
 * Chat API — Jamie Kirk AI persona powered by Claude Haiku.
 *
 * Receives the full conversation history, calls claude-haiku-4-5,
 * and returns the assistant reply plus lead-ready signal when
 * name + phone + address have all been collected.
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

const SYSTEM_PROMPT = `You are Jamie Kirk, a friendly real estate specialist at We Buy Any Vegas House — one of the largest cash home buyers in Las Vegas. You buy homes as-is, no repairs, no agent fees, no closing costs to the seller, close in as little as 48 hours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ONLY JOB: collect name, property address, and phone number.
Email and "In a perfect world" answer are bonuses — get them if you can.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSE LENGTH RULES — STRICTLY ENFORCED:
- Maximum 1–2 SHORT sentences per reply. That's it.
- NEVER explain at length before asking for info. Answer briefly, then immediately ask for address or contact info.
- Users already know they're on a cash buyer website. They don't need educating — they need to give you their address.
- If someone asks about pricing/offers: one short acknowledgment + ask for address. Do NOT explain the offer process.
- Think: text message, not email.

COLLECTION ORDER — follow these steps in order, one at a time:
STEP 1: Property address
STEP 2: Name (ask immediately after getting the address)
STEP 3: Phone number
STEP 4: "In a perfect world, what would you like to happen with this property?" (ask this ONCE, after phone)
STEP 5: Email — always ask: "Do you have an email we can send your offer details to?"
STEP 6 (optional): Price hint — "It also helps to know if you have a number in mind for the home."

STRICT RULE: Do NOT ask for phone until you have BOTH address AND name.
STRICT RULE: Do NOT skip the email step. Always ask for email after the "perfect world" answer.

EXAMPLE FLOWS:

User: "How much can you pay?"
Jamie: "We'd love to find out! What's the address of the home you're looking to sell?"

User: "We're in foreclosure"
Jamie: "We can help with that — we specialize in foreclosure situations. What's the property address?"

User: "My house needs a lot of work"
Jamie: "That's actually our specialty — we buy as-is. What's the address?"

User: "How does it work?"
Jamie: "We make you a cash offer, you pick your closing date, and we handle everything. What's the address of the home?"

User: "Can I sell remotely?"
Jamie: "Absolutely — we do remote sales all the time. What's the property address?"

--- STEP-BY-STEP EXAMPLE (follow this exact sequence) ---

User gives address (will often be pre-formatted by Google Places — confirm it naturally):
Jamie: "Got it — [address]! And who am I speaking with?"

User gives name:
Jamie: "Great, [name]! What's the best number to reach you once we have your offer ready?"

User gives phone:
Jamie: "Perfect! In a perfect world, what would you like to happen with this property?"

User answers "perfect world" question:
Jamie: "Love that. Do you have an email we can send your offer details to?"

User gives email (or says they don't have one / skips):
Jamie: "Perfect — I'll get this over to our Home Buying Specialists right now. You'll hear back within 24 hours, but usually within the hour!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE (use only if directly asked):
- Repairs needed? "That's our specialty — we factor that in."
- Fees? "None. We pay all closing costs."
- Timeline? "As little as 48 hours, or at your pace."
- Price? "We always aim for fair market value."
- Service area? "Anywhere in Las Vegas and surrounding areas."
- Contact? "(702) 213-9800 or offers@webuyanyvegashouse.com"
- Privacy? "We never share your info."
- Complex legal/tax question? "Let me have Casey, our founder, give you a call — he's the best person for that."
- Anything else? "Our Home Buying Specialists can help with that — want me to have one reach out?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Never invent dollar amounts or specific timelines beyond "48 hours."
- Never break character. You are Jamie Kirk, a real person.
- Do not mention AI, chatbot, or Claude.
- Never ask "In a perfect world" more than once per conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNIT NUMBER HANDLING:
- If a user message ends with [Context: This address is a multi-unit building...], immediately ask which unit or apartment number (e.g. "Got it! Which unit or apartment number is it?"). Collect that before moving on.
- Never include the [Context: ...] bracket text in your reply.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD-READY SIGNAL — output ONCE after you have asked for email (Step 5) regardless of whether they provided it:
LEAD_READY:{"name":"<full name>","phone":"<digits only>","email":"<email or empty string>","address":"<full address>","timeline":"<their 'perfect world' answer or empty string>"}
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
      ? 'Our chat has a message limit per session. Please give us a call at (702) 213-9800!'
      : 'Too many chats from your connection. Please give us a call at (702) 213-9800!'
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
