'use client'

/**
 * Chat interface tab — Claude AI / Jamie persona.
 *
 * Address handling: when Jamie asks for an address, the user types and sends
 * normally. If the input looks like a street address (starts with digits),
 * it's silently resolved via Google Places. The user's bubble shows what
 * they typed; Claude receives the full formatted address and confirms it back.
 *
 * Webhook: fires to /api/leads/stream after 2 minutes of dormancy following
 * LEAD_READY, or immediately on component unmount via navigator.sendBeacon.
 * This ensures the transcript includes the full "In a perfect world" exchange.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { getTrackingParams, getHandlCookieValues, getGAClientId, getHandlID } from '@/lib/leads/tracking-params'
import type { ChatMessage } from '@/app/api/chat/route'

export type { ChatMessage }

interface ChatInterfaceProps {
  sessionToken: string
  panelOpen: boolean
  onSchedule: () => void
  onCall: () => void
}

type ExtractedFields = {
  name?: string
  phone?: string
  email?: string
  address?: string
  timeline?: string
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm Parker with PaperLotLand 👋\n\nLooking to buy or sell land in the Las Vegas Valley? I can help connect you with our off-market network. What are you looking for?",
  ts: Date.now(),
}

const DORMANCY_MS = 2 * 60 * 1000 // 2 minutes of no new messages → fire webhook

/** Format a raw phone string to (NXX) NXX-XXXX — matches webform submissions. */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Strip leading 1 for 11-digit US numbers
  const d = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return digits // fallback: send as-is
}

function generateSessionToken(): string {
  const ga = getGAClientId()
  if (ga) return `ga_${ga}`
  const handl = getHandlID()
  if (handl) return handl
  return crypto.randomUUID()
}

/**
 * Returns true ONLY when Jamie is explicitly asking the user to provide an address.
 * Uses specific phrases to avoid false-positives when Jamie is confirming an
 * already-collected address (e.g. "Got it — 123 Main St! What's your name?").
 */
function isAskingForAddress(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes("what's the address") ||
    t.includes("what is the address") ||
    t.includes("address of the home") ||
    t.includes("address of your home") ||
    t.includes("address of the property") ||
    t.includes("complete address") ||
    t.includes("the address?") ||
    t.includes("can you share the address") ||
    t.includes("may i know the") ||
    t.includes("looking to sell?")
  )
}

export function ChatInterface({ sessionToken, panelOpen, onSchedule, onCall }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  // leadFired = true once LEAD_READY fires — shows post-lead UI chips
  const [leadFired, setLeadFired] = useState(false)

  // ── Refs (stable across renders, safe to use in effects/cleanup) ───────────
  const [apiReady, setApiReady] = useState(false)
  const addressContextRef = useRef<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>([INITIAL_MESSAGE])
  const leadReadyFieldsRef = useRef<ExtractedFields | null>(null)
  const leadFiredRef = useRef(false)   // deduplicates webhook (separate from UI state)
  const dormancyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionTokenRef = useRef(sessionToken)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const trackEvent = useTrackEvent()

  // Keep refs in sync with latest values
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { sessionTokenRef.current = sessionToken }, [sessionToken])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300)
    return () => clearTimeout(t)
  }, [])

  // Determine if Jamie is explicitly asking the user to provide their address
  const awaitingAddress = useMemo(() => {
    if (messages.length <= 1) return false
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    return lastAssistant ? isAskingForAddress(lastAssistant.content) : false
  }, [messages])

  // ── Google Places — silent background resolution ───────────────────────────

  const loadApiOnce = useCallback(() => {
    if (typeof window === 'undefined' || apiReady) return
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (apiKey && !document.getElementById('google-maps-places')) {
      const script = document.createElement('script')
      script.id = 'google-maps-places'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`
      script.async = true
      document.head.appendChild(script)
    }
    let attempts = 0
    const check = () => {
      if (window.google?.maps?.places?.AutocompleteSuggestion && window.google?.maps?.places?.AutocompleteSessionToken) {
        setApiReady(true)
        return
      }
      if (++attempts < 60) setTimeout(check, 500)
    }
    check()
  }, [apiReady])

  useEffect(() => {
    if (awaitingAddress) loadApiOnce()
  }, [awaitingAddress, loadApiOnce])

  /**
   * Resolve a raw address string to a full Google-formatted address.
   * Only called when the input starts with digits (looks like a street address).
   * Returns null on any failure so the caller falls back to the raw text.
   */
  const resolveAddressSilently = useCallback(
    async (raw: string): Promise<{ address: string; needsUnit: boolean } | null> => {
      if (!apiReady) return null
      try {
        const token = new google.maps.places.AutocompleteSessionToken()
        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: raw,
            sessionToken: token,
            includedRegionCodes: ['us'],
            // 'premise' removed — Google applies it to single-family homes too,
            // causing false "which unit?" prompts. street_address covers houses;
            // subpremise covers typed unit numbers.
            includedPrimaryTypes: ['street_address', 'subpremise'],
          })
        if (!suggestions.length || !suggestions[0].placePrediction) return null

        const place = new google.maps.places.Place({ id: suggestions[0].placePrediction.placeId })
        await place.fetchFields({ fields: ['formattedAddress', 'addressComponents'] })
        if (!place.formattedAddress) return null

        const components = place.addressComponents ?? []
        const hasStreetNumber = components.some((c) => c.types.includes('street_number'))
        const hasSubpremise = components.some((c) => c.types.includes('subpremise'))
        // Only ask for unit if no house number was resolved (matched a building, not a specific address)
        const needsUnit = !hasStreetNumber && !hasSubpremise

        return { address: place.formattedAddress, needsUnit }
      } catch {
        return null
      }
    },
    [apiReady],
  )

  // ── Lead webhook — dormancy-based ─────────────────────────────────────────

  /** Build the chat webhook body from current refs. */
  const buildChatPayload = useCallback(() => {
    const fields = leadReadyFieldsRef.current
    const token = sessionTokenRef.current || generateSessionToken()
    const msgs = messagesRef.current

    // ── Chat metadata ──────────────────────────────────────────────────────
    const firstUserMsg = msgs.find((m) => m.role === 'user')
    const lastMsg = msgs[msgs.length - 1]
    const durationMs =
      firstUserMsg && lastMsg
        ? (lastMsg.ts ?? Date.now()) - (firstUserMsg.ts ?? Date.now())
        : 0
    const durationMin = Math.floor(durationMs / 60000)
    const durationSec = Math.floor((durationMs % 60000) / 1000)
    const chatDuration = `${durationMin}min ${String(durationSec).padStart(2, '0')}sec`

    const device =
      typeof navigator !== 'undefined' &&
      /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? 'Mobile'
        : 'Desktop'

    return JSON.stringify({
      sessionToken: token,
      formId: 'chat-widget',
      formVariant: 'chat',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      trigger: 'chat_transcript',
      fields: {
        name: fields?.name ?? '',
        firstName: fields?.name?.split(' ')[0] ?? '',
        lastName: fields?.name?.split(' ').slice(1).join(' ') ?? '',
        phone: formatPhone(fields?.phone ?? ''),
        email: fields?.email ?? '',
        address: fields?.address ?? '',
        timeline: fields?.timeline ?? '',
      },
      transcript: msgs.map((m) => ({ role: m.role, content: m.content, ts: m.ts ?? Date.now() })),
      chatMeta: {
        duration: chatDuration,
        durationSeconds: Math.floor(durationMs / 1000),
        messageCount: msgs.filter((m) => m.role === 'user').length,
        device,
        agent: 'Jamie',
        engagementType: 'Visitor started chat themselves',
        chatStartedOn: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      tracking: getTrackingParams(),
      handlCookies: getHandlCookieValues(),
    })
  }, [])

  /**
   * Build and POST the webhook payload.
   * Uses refs so it's safe to call from effects and cleanup.
   */
  const doFireWebhook = useCallback(() => {
    if (leadFiredRef.current) return
    leadFiredRef.current = true
    if (leadReadyFieldsRef.current) setLeadFired(true)

    fetch('/api/leads/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildChatPayload(),
      keepalive: true,
    }).catch(() => {})

    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      cta_id: 'chat-transcript-sent',
      cta_text: 'Chat transcript sent',
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    })
  }, [buildChatPayload, trackEvent])

  /**
   * Start/reset the dormancy timer after every new message (any conversation
   * with at least one user message gets recorded, not just LEAD_READY ones).
   * Fires the webhook after 2 minutes of no new messages.
   */
  useEffect(() => {
    const hasUserMessage = messages.some((m) => m.role === 'user')
    if (!hasUserMessage || leadFiredRef.current) return
    if (dormancyTimerRef.current) clearTimeout(dormancyTimerRef.current)
    dormancyTimerRef.current = setTimeout(doFireWebhook, DORMANCY_MS)
    return () => {
      if (dormancyTimerRef.current) clearTimeout(dormancyTimerRef.current)
    }
  }, [messages, doFireWebhook])

  /**
   * Fire immediately when the panel closes (panelOpen false → true transition
   * doesn't happen here, but false means hidden). The panel uses a CSS
   * translate to hide — ChatInterface stays mounted — so unmount cleanup
   * never fires on close. This effect handles that case.
   */
  useEffect(() => {
    if (panelOpen) return
    const hasUserMessage = messagesRef.current.some((m) => m.role === 'user')
    if (!hasUserMessage || leadFiredRef.current) return
    if (dormancyTimerRef.current) clearTimeout(dormancyTimerRef.current)
    doFireWebhook()
  }, [panelOpen, doFireWebhook])

  /**
   * Fire immediately on unmount (panel close / page leave) via sendBeacon.
   * Captures any conversation with at least one user message.
   */
  useEffect(() => {
    return () => {
      if (dormancyTimerRef.current) clearTimeout(dormancyTimerRef.current)
      const hasUserMessage = messagesRef.current.some((m) => m.role === 'user')
      if (!hasUserMessage || leadFiredRef.current) return
      leadFiredRef.current = true

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/leads/stream', new Blob([buildChatPayload()], { type: 'application/json' }))
      }
    }
  }, []) // empty deps: intentionally captures only refs (mutable, always current)

  // ── Core send ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      // Silent address resolution:
      // - Only attempt if Jamie is asking for an address
      // - Only attempt if the input starts with a number (looks like a street address)
      // - The user's bubble always shows what they typed; only the API payload changes
      let resolvedAddress: string | null = null
      const looksLikeStreetAddress = /^\d{1,6}\s+\w/.test(trimmed)
      if (awaitingAddress && looksLikeStreetAddress && apiReady) {
        const resolved = await resolveAddressSilently(trimmed)
        if (resolved) {
          resolvedAddress = resolved.address
          if (resolved.needsUnit) {
            addressContextRef.current =
              '[Context: This address is a multi-unit building. Please ask which unit or apartment number before proceeding.]'
          }
        }
      }

      const extraContext = addressContextRef.current
      addressContextRef.current = null

      // Display bubble always shows what the user actually typed
      const userMsg: ChatMessage = { role: 'user', content: trimmed, ts: Date.now() }
      const displayMessages = [...messages, userMsg]
      setMessages(displayMessages)
      setInput('')
      setLoading(true)

      trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
        cta_id: 'chat-message-sent',
        cta_text: 'Chat message sent',
        page_url: typeof window !== 'undefined' ? window.location.pathname : '',
      })

      // Build API messages: substitute resolved address and/or inject unit context
      const apiContent = (resolvedAddress ?? trimmed) + (extraContext ? ' ' + extraContext : '')
      const apiMessages: ChatMessage[] = (resolvedAddress || extraContext)
        ? [...displayMessages.slice(0, -1), { ...userMsg, content: apiContent }]
        : displayMessages

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, sessionToken, pageUrl: typeof window !== 'undefined' ? window.location.pathname : '' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.reply || "Sorry, I ran into an issue. Please call us at (702) 213-9800!",
          ts: Date.now(),
        }
        setMessages([...displayMessages, assistantMsg])

        // Store lead fields; webhook fires via dormancy timer (not immediately)
        if (data.leadReady && data.extractedFields && !leadReadyFieldsRef.current) {
          leadReadyFieldsRef.current = data.extractedFields
          setLeadFired(true) // show post-lead UI chips immediately
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I'm having a little trouble right now. You can reach us directly at (702) 213-9800 or schedule a call below!",
            ts: Date.now(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading, sessionToken, awaitingAddress, apiReady, resolveAddressSilently, trackEvent],
  )

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!fileInputRef.current) return
      fileInputRef.current.value = ''
      if (!file) return

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/chat/upload', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok || data.error) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Sorry, upload failed: ${data.error || 'unknown error'}`, ts: Date.now() },
          ])
          return
        }

        const attachMsg: ChatMessage = {
          role: 'user',
          content: `I've attached a ${data.kind === 'image' ? 'photo' : 'document'}: ${data.filename}`,
          ts: Date.now(),
          attachmentUrl: data.url,
          attachmentName: data.filename,
          attachmentKind: data.kind,
        }
        const afterAttach = [...messages, attachMsg]
        setMessages(afterAttach)
        setLoading(true)

        const claudeRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: afterAttach.map((m) => ({
              role: m.role,
              content: m.attachmentUrl
                ? `[${m.attachmentKind === 'image' ? 'Photo' : 'Document'} attached: ${m.attachmentName}]`
                : m.content,
            })),
            sessionToken,
            pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
          }),
        })
        if (claudeRes.ok) {
          const claudeData = await claudeRes.json()
          const replyMsg: ChatMessage = {
            role: 'assistant',
            content: claudeData.reply || "Got it! Thanks for sending that over.",
            ts: Date.now(),
          }
          setMessages([...afterAttach, replyMsg])
          if (claudeData.leadReady && claudeData.extractedFields && !leadReadyFieldsRef.current) {
            leadReadyFieldsRef.current = claudeData.extractedFields
            setLeadFired(true)
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "Hmm, I had trouble with that upload. You can also email photos to info@paperlotland.com!", ts: Date.now() },
        ])
      } finally {
        setUploading(false)
        setLoading(false)
      }
    },
    [messages, sessionToken],
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const prevRole = i > 0 ? messages[i - 1].role : null
          const showAvatar = !isUser && prevRole !== 'assistant'

          return (
            <div
              key={i}
              className={`flex items-end gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-6 shrink-0">
                {!isUser && showAvatar && (
                  <Image
                    src="/images/team/parker-gibbons.jpg"
                    alt="Jamie"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
              </div>

              <div className="max-w-[75%]">
                {msg.attachmentKind === 'image' && msg.attachmentUrl && (
                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.attachmentUrl}
                      alt={msg.attachmentName ?? 'Attached photo'}
                      className="max-h-48 w-auto rounded-2xl object-cover"
                    />
                  </a>
                )}

                {msg.attachmentKind === 'document' && msg.attachmentUrl && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      'mb-1 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5',
                      isUser ? 'bg-[#007AFF]' : 'bg-[#E9E9EB]',
                    ].join(' ')}
                  >
                    <svg className={`h-7 w-7 shrink-0 ${isUser ? 'text-white/80' : 'text-[#8E8E93]'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                    </svg>
                    <span className={`truncate text-[13px] font-medium ${isUser ? 'text-white' : 'text-[#1C1C1E]'}`}>
                      {msg.attachmentName ?? 'Document'}
                    </span>
                  </a>
                )}

                {!msg.attachmentUrl && (
                  <div
                    className={[
                      'px-3.5 py-2 text-[15px] leading-relaxed whitespace-pre-wrap',
                      isUser
                        ? 'rounded-[20px] rounded-br-[5px] bg-[#007AFF] text-white'
                        : 'rounded-[20px] rounded-bl-[5px] bg-[#E9E9EB] text-[#1C1C1E]',
                    ].join(' ')}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-end gap-1.5">
            <Image
              src="/images/team/parker-gibbons.jpg"
              alt="Jamie"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
            <div className="rounded-[20px] rounded-bl-[5px] bg-[#E9E9EB] px-4 py-3">
              <span className="flex gap-[3px] items-center">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E8E93] [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E8E93] [animation-delay:160ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E8E93] [animation-delay:320ms]" />
              </span>
            </div>
          </div>
        )}

        {leadFired && !loading && (
          <div className="flex flex-wrap gap-2 pt-2 pl-[30px]">
            <button
              type="button"
              onClick={onSchedule}
              className="rounded-full border border-[#007AFF] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#007AFF] transition active:bg-blue-50"
            >
              📅 Schedule a call
            </button>
            <button
              type="button"
              onClick={onCall}
              className="rounded-full border border-[#34C759] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#34C759] transition active:bg-green-50"
            >
              📞 Call now
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick-reply starter chips */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 bg-white px-3 pb-2">
          {["See off-market deals", 'How does it work?', 'Schedule a call'].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className="rounded-full border border-[#C7C7CC] bg-white px-3 py-1.5 text-[13px] text-[#007AFF] transition active:bg-slate-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* iMessage-style input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
        className="flex items-end gap-2 border-t border-[#C7C7CC]/60 bg-white px-3 py-2"
      >
        {/* + attachment button */}
        <button
          type="button"
          aria-label="Add attachment"
          disabled={uploading || loading}
          onClick={() => fileInputRef.current?.click()}
          className="mb-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#E9E9EB] text-[#3C3C43] transition active:bg-[#D1D1D6] disabled:opacity-40"
        >
          {uploading ? (
            <svg className="h-4 w-4 animate-spin text-[#8E8E93]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        {/* Input pill */}
        <div className="flex flex-1 items-end rounded-[20px] border border-[#C7C7CC] bg-white px-3.5 py-1.5">
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="iMessage"
            disabled={loading}
            className="w-full bg-transparent text-[15px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Send button — blue when text present, grey arrow when empty (no mic) */}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className={[
            'mb-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition',
            input.trim() && !loading ? 'bg-[#007AFF] text-white' : 'bg-[#E9E9EB] text-[#8E8E93]',
          ].join(' ')}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
