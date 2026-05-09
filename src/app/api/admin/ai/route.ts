import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an expert content writer and SEO specialist for We Buy Any Vegas House, a cash home buying company in Las Vegas, Nevada.

Your writing style is:
- Helpful, trustworthy, and empathetic to home sellers in difficult situations
- Clear and direct — no fluff, no excessive jargon
- Local to Las Vegas: reference neighborhoods, landmarks, market conditions when relevant
- SEO-conscious: naturally include target keywords without keyword stuffing
- Conversion-focused: guide readers toward requesting a cash offer

When generating blog content:
- Use ## for main section headings (H2) and ### for sub-headings (H3)
- Write in plain markdown: **bold** for emphasis, [link text](url) for links, - for bullet lists
- Separate paragraphs with blank lines (\\n\\n)
- Each post should be well-structured with an intro, multiple sections, and a strong CTA conclusion
- Aim for 800-1500 words for standard posts
- Always end with a CTA section encouraging readers to contact We Buy Any Vegas House

When reviewing content:
- Be specific and actionable in suggestions
- Check for: missing local references, weak CTAs, thin sections, missing keywords
- Point out both strengths and areas for improvement

When generating SEO metadata:
- Title: 50-60 chars, include primary keyword + "Las Vegas" when possible
- Description: 150-160 chars, compelling and includes a value proposition
- Keywords: 5-8 relevant keyword phrases, mix of short-tail and long-tail`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 503 }
    )
  }

  const client = new Anthropic({ apiKey })

  try {
    const body = await req.json()
    const { message, context } = body as {
      message: string
      action?: string
      context?: {
        title?: string
        content?: string
        category?: string
        excerpt?: string
      }
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build user message with context
    let userContent = message
    if (context?.title || context?.content) {
      const parts: string[] = []
      if (context.title) parts.push(`Post title: ${context.title}`)
      if (context.category) parts.push(`Category: ${context.category}`)
      if (context.excerpt) parts.push(`Current excerpt: ${context.excerpt}`)
      if (context.content && context.content.length > 0) {
        const preview = context.content.slice(0, 2000)
        const truncated = context.content.length > 2000 ? '… [truncated]' : ''
        parts.push(`Current content:\n${preview}${truncated}`)
      }
      if (parts.length > 0) {
        userContent = `${parts.join('\n')}\n\n---\n\n${message}`
      }
    }

    // Stream the response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    if (err.status === 401) {
      return NextResponse.json(
        { error: 'Invalid ANTHROPIC_API_KEY. Check your .env.local file.' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: err.message || 'AI request failed' },
      { status: 500 }
    )
  }
}
