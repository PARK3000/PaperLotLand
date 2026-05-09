import { NextRequest, NextResponse } from 'next/server'

const BLOB_HOST_SUFFIX = '.private.blob.vercel-storage.com'
const BLOB_TOKEN =
  process.env.BLOBAPPLICANTS_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only proxy Vercel private blob URLs for this store — prevent open redirect abuse
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  if (!BLOB_TOKEN) {
    return new NextResponse('Storage not configured', { status: 503 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${BLOB_TOKEN}` },
    })

    if (!upstream.ok) {
      return new NextResponse('File not found', { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const contentDisposition = upstream.headers.get('content-disposition') ?? ''

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch file', { status: 502 })
  }
}
