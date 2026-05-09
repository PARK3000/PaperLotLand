import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
]

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  const token = process.env.BLOBAPPLICANTS_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
  const eventType = body?.type ?? 'unknown'

  console.log('[api/upload] received event:', eventType)
  console.log('[api/upload] token present:', Boolean(token))

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => ({
        maximumSizeInBytes: 500 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {
        console.log('[api/upload] upload completed callback received')
      },
    })
    console.log('[api/upload] handleUpload success for event:', eventType)
    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('[api/upload] handleUpload error for event:', eventType)
    console.error('[api/upload]', (error as Error).message)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
