/** Metadata & helpers for public legal / policy document pages. */

export const LEGAL_PAGE_EYEBROW = 'Halaman Informasi'
export const LEGAL_DOCUMENT_EYEBROW = 'Dokumen Portal'

export const LEGAL_SLUGS = [
  'about',
  'ethics',
  'editorial',
  'terms',
  'media-siber',
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export const LEGAL_SLUG_TITLES: Record<LegalSlug, string> = {
  about: 'Tentang Kami',
  ethics: 'Kode Etik',
  editorial: 'Redaksi',
  terms: 'Ketentuan Penggunaan',
  'media-siber': 'Pedoman Media Siber',
}

export const LEGAL_PAGE_INTROS: Record<LegalSlug, string> = {
  about: 'Mengenal identitas, arah editorial, dan komitmen portal dalam melayani pembaca di wilayah ini.',
  ethics: 'Pedoman etika redaksi dan prinsip kerja jurnalistik yang menjadi dasar setiap proses peliputan.',
  editorial: 'Struktur redaksi, penanggung jawab, dan informasi kelembagaan yang menjadi fondasi operasional portal.',
  terms: 'Ketentuan penggunaan layanan, hak cipta, serta batas tanggung jawab yang berlaku bagi seluruh pengguna.',
  'media-siber':
    'Rujukan pedoman media siber dan praktik publikasi yang mengikuti prinsip tanggung jawab pers.',
}

type SiteSettingsLike = {
  aboutUs?: string | null
  codeOfEthics?: string | null
  editorial?: string | null
  termsOfService?: string | null
  mediaSiber?: string | null
  privacyPolicy?: string | null
}

export type LegalPageConfig = {
  id: string
  slug: string
  title: string
  settingsKey: keyof SiteSettingsLike
  intro: string
  href: (siteId: string) => string
}

export const ALL_LEGAL_PAGES: LegalPageConfig[] = [
  {
    id: 'aboutUs',
    slug: 'about',
    title: 'Tentang Kami',
    settingsKey: 'aboutUs',
    intro: 'Mengenal identitas, arah editorial, dan komitmen portal dalam melayani pembaca di wilayah ini.',
    href: (siteId) => `/${siteId}/p/about`,
  },
  {
    id: 'editorial',
    slug: 'editorial',
    title: 'Redaksi',
    settingsKey: 'editorial',
    intro: 'Struktur redaksi, penanggung jawab, dan informasi kelembagaan yang menjadi fondasi operasional portal.',
    href: (siteId) => `/${siteId}/p/editorial`,
  },
  {
    id: 'codeOfEthics',
    slug: 'ethics',
    title: 'Kode Etik',
    settingsKey: 'codeOfEthics',
    intro: 'Pedoman etika redaksi dan prinsip kerja jurnalistik yang menjadi dasar setiap proses peliputan.',
    href: (siteId) => `/${siteId}/p/ethics`,
  },
  {
    id: 'privacyPolicy',
    slug: 'kebijakan-privasi',
    title: 'Kebijakan Privasi',
    settingsKey: 'privacyPolicy',
    intro: 'Penjelasan mengenai bagaimana portal mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna serta informasi yang relevan dengan operasional layanan.',
    href: (siteId) => `/${siteId}/kebijakan-privasi`,
  },
  {
    id: 'mediaSiber',
    slug: 'media-siber',
    title: 'Pedoman Media Siber',
    settingsKey: 'mediaSiber',
    intro: 'Rujukan pedoman media siber dan praktik publikasi yang mengikuti prinsip tanggung jawab pers.',
    href: (siteId) => `/${siteId}/p/media-siber`,
  },
  {
    id: 'termsOfService',
    slug: 'terms',
    title: 'Ketentuan Penggunaan',
    settingsKey: 'termsOfService',
    intro: 'Ketentuan penggunaan layanan, hak cipta, serta batas tanggung jawab yang berlaku bagi seluruh pengguna.',
    href: (siteId) => `/${siteId}/p/terms`,
  },
]

export const PRIVACY_PAGE = {
  title: 'Kebijakan Privasi',
  intro:
    'Penjelasan mengenai bagaimana portal mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna serta informasi yang relevan dengan operasional layanan.',
  settingsKey: 'privacyPolicy' as const,
}

const CONTENT_BY_SLUG: Record<
  LegalSlug,
  { title: string; settingsKey: keyof SiteSettingsLike }
> = {
  about: { title: LEGAL_SLUG_TITLES.about, settingsKey: 'aboutUs' },
  ethics: { title: LEGAL_SLUG_TITLES.ethics, settingsKey: 'codeOfEthics' },
  editorial: { title: LEGAL_SLUG_TITLES.editorial, settingsKey: 'editorial' },
  terms: { title: LEGAL_SLUG_TITLES.terms, settingsKey: 'termsOfService' },
  'media-siber': { title: LEGAL_SLUG_TITLES['media-siber'], settingsKey: 'mediaSiber' },
}

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug)
}

export function resolveLegalPage(
  slug: LegalSlug,
  siteSettings: SiteSettingsLike | null | undefined
): { title: string; content: string | null | undefined; intro: string } {
  const meta = CONTENT_BY_SLUG[slug]
  const content = siteSettings?.[meta.settingsKey] ?? null

  return {
    title: meta.title,
    content,
    intro: LEGAL_PAGE_INTROS[slug],
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

/** Normalize CMS HTML or plain text into safe HTML for legal document bodies. */
export function formatLegalRichContent(value: string | null | undefined) {
  if (!value) return ''
  if (looksLikeHtml(value)) return value

  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function normalizeComparableText(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const LEADING_BLOCK_RE =
  /^\s*<(h[1-3]|p|div)(?:\s[^>]*)?>([\s\S]*?)<\/\1>\s*/i

/**
 * Remove only the leading heading when it repeats the page H1 exactly.
 * Paragraphs/divs are kept because they are considered authored content.
 */
export function prepareLegalDocumentContent(
  value: string | null | undefined,
  options?: { pageTitle?: string; intro?: string }
) {
  let html = formatLegalRichContent(value)
  if (!html || !options?.pageTitle) return html

  const titleNorm = normalizeComparableText(options.pageTitle)
  let guard = 0
  while (guard < 8) {
    guard += 1
    const match = html.match(LEADING_BLOCK_RE)
    if (!match) break

    const tagName = match[1].toLowerCase()
    const inner = match[2]
    const innerNorm = normalizeComparableText(inner)

    const duplicatesTitle = /^h[1-3]$/.test(tagName) && innerNorm === titleNorm

    if (!duplicatesTitle) break

    html = html.slice(match[0].length).trim()
  }

  return html
}
