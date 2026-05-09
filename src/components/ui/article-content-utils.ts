import { slugify } from '@/lib/utils'
import { TocItem } from './table-of-contents'

function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function stripForId(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAF8}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .trim()
}

export function extractTocItems(content: string): TocItem[] {
  const paragraphs = content.split('\n\n').filter((p) => p.trim())
  const items: TocItem[] = []

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (trimmed.startsWith('## ')) {
      const raw = trimmed.replace('## ', '')
      const text = stripHeadingMarkdown(raw)
      items.push({ id: slugify(stripForId(raw)), text, level: 2 })
    } else if (trimmed.startsWith('### ')) {
      const raw = trimmed.replace('### ', '')
      const text = stripHeadingMarkdown(raw)
      items.push({ id: slugify(stripForId(raw)), text, level: 3 })
    }
  }

  return items
}
