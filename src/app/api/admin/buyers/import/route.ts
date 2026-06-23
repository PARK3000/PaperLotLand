import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { importBuyersByEmail } from '@/lib/admin/buyers'

const MAX_SIZE_MB = 5

function findEmailColumn(headers: string[]): string | null {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''))
  const idx = normalized.findIndex((h) => h.includes('email'))
  return idx === -1 ? null : headers[idx]
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, or .csv files are supported' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB}MB)` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'The file has no rows' }, { status: 400 })
    }

    const emailColumn = findEmailColumn(Object.keys(rows[0]))
    if (!emailColumn) {
      return NextResponse.json({ error: 'Could not find an email column in the file' }, { status: 400 })
    }

    const emails = rows
      .map((r) => r[emailColumn])
      .filter((v): v is string => typeof v === 'string')

    const result = await importBuyersByEmail(emails)
    return NextResponse.json({ success: true, ...result })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
