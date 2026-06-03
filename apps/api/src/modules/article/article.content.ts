const MIN_WORDS = 50
const MAX_BLOCKS = 200
const MAX_WORDS = 100_000

export function extractTextFromBlocks(blocks: any[] | undefined): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((b) => b?.type === 'paragraph' || b?.type === 'heading')
    .map((b) => (typeof b.content === 'string' ? b.content : ''))
    .join(' ')
    .trim()
}

export function countWords(text: string): number {
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function buildMetaDescriptionExcerpt(blocks: any[] | undefined, maxLen = 160): string {
  const text = extractTextFromBlocks(blocks)
  if (!text) return ''
  return text.length <= maxLen ? text : `${text.slice(0, maxLen - 3).trim()}...`
}

export function trimExcerpt(text: string | undefined, maxLen = 160): string {
  const value = text?.trim() || ''
  if (!value) return ''
  return value.length <= maxLen ? value : `${value.slice(0, maxLen - 3).trim()}...`
}

export type ArticleContentLimitOptions = {
  /** Wajib untuk submit/publish; draft boleh disimpan di bawah batas ini. */
  requireMinWords?: boolean
}

export function validateArticleContentLimits(
  blocks?: any[],
  options: ArticleContentLimitOptions = {}
): void {
  if (!blocks) return
  if (blocks.length > MAX_BLOCKS) {
    throw Object.assign(
      new Error(`Maksimal ${MAX_BLOCKS} blok konten per artikel`),
      { statusCode: 400 }
    )
  }
  const words = countWords(extractTextFromBlocks(blocks))
  if (options.requireMinWords && words < MIN_WORDS) {
    throw Object.assign(
      new Error(`Minimal ${MIN_WORDS} kata sebelum artikel dapat dikirim atau diterbitkan`),
      { statusCode: 400 }
    )
  }
  if (words > MAX_WORDS) {
    throw Object.assign(
      new Error(`Konten melebihi batas ${MAX_WORDS.toLocaleString('id-ID')} kata`),
      { statusCode: 400 }
    )
  }
}

export function applySeoDefaults<T extends { title: string; blocks?: any[]; excerpt?: string; metaDescription?: string }>(
  input: T
): T & { metaDescription?: string } {
  if (input.metaDescription?.trim()) return input
  const excerptFromField = trimExcerpt(input.excerpt)
  if (excerptFromField) return { ...input, metaDescription: excerptFromField }
  const excerptFromBlocks = buildMetaDescriptionExcerpt(input.blocks)
  if (!excerptFromBlocks) return input
  return { ...input, metaDescription: excerptFromBlocks }
}
