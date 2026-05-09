/**
 * Chat attachment upload — stores visitor files (property photos, documents)
 * in Vercel Blob under chat-attachments/ and returns the public URL.
 *
 * Accepted: images (jpeg, png, webp, heic, gif) and documents (pdf, doc, docx).
 * Max size: 20 MB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

const MAX_SIZE_MB = 20

const ALLOWED_MIME: Record<string, { ext: string; kind: 'image' | 'document' }> = {
  'image/jpeg':    { ext: 'jpg',  kind: 'image' },
  'image/png':     { ext: 'png',  kind: 'image' },
  'image/webp':    { ext: 'webp', kind: 'image' },
  'image/gif':     { ext: 'gif',  kind: 'image' },
  'image/heic':    { ext: 'heic', kind: 'image' },
  'image/heif':    { ext: 'heif', kind: 'image' },
  'application/pdf':                                                    { ext: 'pdf',  kind: 'document' },
  'application/msword':                                                 { ext: 'doc',  kind: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', kind: 'document' },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const meta = ALLOWED_MIME[file.type]
    if (!meta) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload an image (JPG, PNG, WEBP, GIF, HEIC) or document (PDF, DOC, DOCX).' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large — max ${MAX_SIZE_MB} MB.` },
        { status: 400 },
      )
    }

    // Folder by month so blob listing stays manageable
    const now = new Date()
    const folder = `chat-attachments/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const timestamp = Date.now()
    const safeName = file.name
      .replace(/\.[^.]+$/, '')           // strip extension
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
    const pathname = `${folder}/${timestamp}-${safeName}.${meta.ext}`

    const blob = await put(pathname, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: file.type,
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      kind: meta.kind,   // 'image' | 'document'
      size: file.size,
    })
  } catch (err: unknown) {
    console.error('[Chat Upload]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Upload failed' },
      { status: 500 },
    )
  }
}
