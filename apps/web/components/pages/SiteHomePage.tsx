import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '../ui/NewsCard'
import PublicSiteLayout from '../layout/PublicSiteLayout'
import AdSpace from '../ui/AdSpace'
import Link from 'next/link'
import { TrendingUp, Zap, Star, Mail, ArrowRight } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from 'react-icons/si'
import LoadMoreArticles from '../ui/LoadMoreArticles'
import SavedArticlesFeed from '../ui/SavedArticlesFeed'
import VideoWidget from '../ui/VideoWidget'
import { MagazineBentoHero } from '../berita/MagazineBentoHero'
import { notFound } from 'next/navigation'
import ScrollAnimate from '../ui/ScrollAnimate'
import { Container } from '../layout/Container'

function resolveCategoryName(slug: string, categoriesTree: any[] = []): string {
  if (slug === 'terbaru') return 'Terbaru'
  if (slug === 'tersimpan') return 'Tersimpan'
  for (const cat of categoriesTree) {
    if (cat.slug === slug) return cat.name
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        if (sub.slug === slug) return `${cat.name} / ${sub.name}`
      }
    }
  }
  return slug
}

function buildWhatsAppUrl(phone?: string | null, siteName?: string) {
  if (!phone) return null

  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  const normalizedNumber = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits

  const intro = encodeURIComponent(`Halo ${siteName || 'BeritaKarya'}, saya ingin bergabung dengan channel WhatsApp.`)
  return `https://wa.me/${normalizedNumber}?text=${intro}`
}

const sectionEyebrowClass = 'text-[11px] font-black uppercase tracking-[0.18em]'
const sectionEyebrowMutedClass = `${sectionEyebrowClass} text-gray-500 dark:text-gray-400`
const sectionMetaClass = 'text-[10px] font-semibold text-gray-500 dark:text-gray-400'
const sectionTitleClass = 'text-[1.9rem] md:text-[2.2rem] font-serif font-black tracking-[-0.04em] text-brand-black dark:text-white'
const sectionDeckClass = 'max-w-2xl text-sm md:text-[15px] leading-relaxed text-brand-text-muted dark:text-gray-400'

function formatSidebarDate(dateValue?: string | Date) {
  if (!dateValue) return ''

  return new Date(dateValue).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

type SearchParams = {
  cat?: string
  q?: string
}

type SiteHomePageProps = {
  siteParam: string
  searchParams: SearchParams
}

async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    let url = `${apiUrl}/api/v1/articles/public?site=${siteId}&limit=25`

    if (category && category !== 'terbaru' && category !== 'tersimpan') {
      url += `&category=${encodeURIComponent(category)}`
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data?.items || []
  } catch (e) {
    console.error('Error fetching articles:', e)
    return []
  }
}

async function getCategories(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/categories/tree?site=${siteId}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data || []
  } catch (e) {
    console.error('Error fetching categories tree:', e)
    return []
  }
}

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch (e) {
    console.error('Error fetching site settings:', e)
    return null
  }
}

export async function SiteHomePage({ siteParam, searchParams }: SiteHomePageProps) {
  const resolvedSearchParams = await searchParams
  const categoryFilter = resolvedSearchParams?.cat || 'terbaru'
  const searchQuery = resolvedSearchParams?.q || ''

  const siteSettings = await getSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = {
    id: siteParam,
    name:
      siteSettings?.name || (SITE_MAP[siteParam] as any)?.name ||
      (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain:
      siteSettings?.domain || (SITE_MAP[siteParam] as any)?.domain ||
      `${siteParam}.beritakarya.co`,
    description: siteSettings?.description || (SITE_MAP[siteParam] as any)?.description || `Portal berita resmi ${siteParam}. Menyajikan informasi terbaru, investigasi, dan analisis tajam dari seluruh Nusantara.`,
    logoUrl: siteSettings?.logoUrl || (SITE_MAP[siteParam] as any)?.logoUrl || null,
    footerText: siteSettings?.footerText || (SITE_MAP[siteParam] as any)?.footerText || `© ${new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.`,
    address: siteSettings?.address || (SITE_MAP[siteParam] as any)?.address || "Jl. Merdeka No. 123, Jakarta Pusat, Indonesia",
    contactEmail: siteSettings?.contactEmail || (SITE_MAP[siteParam] as any)?.contactEmail || "support.beritakarya@gmail.com",
    phone: siteSettings?.phone || (SITE_MAP[siteParam] as any)?.phone || null,
    aboutUs: siteSettings?.aboutUs || (SITE_MAP[siteParam] as any)?.aboutUs || null,
    codeOfEthics: siteSettings?.codeOfEthics || (SITE_MAP[siteParam] as any)?.codeOfEthics || null,
    editorial: siteSettings?.editorial || (SITE_MAP[siteParam] as any)?.editorial || null,
    advertising: siteSettings?.advertising || (SITE_MAP[siteParam] as any)?.advertising || null,
    socialLinks: siteSettings?.socialLinks || (SITE_MAP[siteParam] as any)?.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' },
    appearance: siteSettings?.appearance || (SITE_MAP[siteParam] as any)?.appearance || { primaryColor: '#e11d48' },
    devDomain: (SITE_MAP[siteParam] as any)?.devDomain || `${siteParam}.localhost:3000`
  }

  const articlesList = await getArticles(siteConfig.id, categoryFilter, searchQuery)
  const categoriesTree = await getCategories(siteConfig.id)
  const topBentoStories = articlesList.slice(0, 4)
  const minimalStories = articlesList.slice(4, 8)
  const editorChoice = articlesList
    .filter((a: any) => a.isFeatured || a.isExclusive)
    .filter((a: any) => !topBentoStories.some((story: any) => story.id === a.id) && !minimalStories.some((story: any) => story.id === a.id))
    .slice(0, 3)
  const isCategoryFilter = categoryFilter && categoryFilter !== 'terbaru' && categoryFilter !== 'tersimpan'
  const homepageFeed = articlesList.slice(8, 16)
  const mainFeed = isCategoryFilter ? articlesList : (homepageFeed.length > 0 ? homepageFeed : articlesList)
  const supplementalStories = !isCategoryFilter ? articlesList.slice(16) : []
  const videoStories = supplementalStories.slice(0, 3)
  const photojournalism = supplementalStories.slice(3, 6)
  const opinionAnalisis = supplementalStories.slice(6, 9)
  const popularPool = !isCategoryFilter ? articlesList.slice(8, 13) : articlesList.slice(0, 5)
  const popular = popularPool.length > 0 ? popularPool : articlesList.slice(0, 5)

  const defaultTags = ['Politik', 'Ekonomi', 'Investigasi', 'Teknologi', 'Gaya Hidup', 'Hiburan']
  const tags = (siteSettings?.trendingTopics as string[])?.length > 0
    ? (siteSettings.trendingTopics as string[])
    : defaultTags
  const whatsappUrl = buildWhatsAppUrl(siteConfig.phone, siteConfig.name)
  const telegramUrl = siteConfig.socialLinks?.telegram || null
  const reportUrl = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Laporan Warga untuk ${siteConfig.name}`)}`
  const showHomepageHero = !searchQuery && categoryFilter === 'terbaru' && topBentoStories.length > 0
  const showSavedFeed = categoryFilter === 'tersimpan'
  const showEditorFocus = showHomepageHero && minimalStories.length > 0
  const showTrending = tags.length > 0
  const showInlineSponsor = mainFeed.length > 3
  const showPopularSidebar = popular.length > 0
  const showEditorChoice = editorChoice.length >= 3
  const showOpinionSection = opinionAnalisis.length >= 3
  const showPhotoSection = photojournalism.length >= 3
  const showVideoSection = videoStories.length >= 3
  const showEditorialExtras = !searchQuery && categoryFilter === 'terbaru' && (showEditorChoice || showOpinionSection || showPhotoSection || showVideoSection)
  const featuredFeed = mainFeed.slice(0, 2)
  const streamFeed = mainFeed.slice(2, 8)

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="pb-28 md:pb-8">
        <Container className="py-6 md:py-8">
          <div className="flex justify-center rounded-3xl border border-black/5 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] dark:border-white/5 dark:bg-white/[0.02] md:p-6">
            <AdSpace type="leaderboard" />
          </div>
        </Container>

        {showHomepageHero && (
          <section className="border-y border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
            <Container className="py-8 md:py-10">
              <MagazineBentoHero articles={topBentoStories} site={siteParam} />

              {showEditorFocus && (
                <div className="mt-10 md:mt-12">
                  <div className="mb-6 flex items-center gap-2">
                    <Zap size={16} className="text-brand-red" />
                    <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Fokus Redaksi</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {minimalStories.map((article: any) => (
                      <NewsCard key={article.id} article={article} variant="medium" site={siteParam} />
                    ))}
                  </div>
                </div>
              )}
            </Container>
          </section>
        )}

        <Container className="py-10 md:py-12">
          {showTrending && (
            <section className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="flex shrink-0 items-center gap-2">
                <TrendingUp size={16} className="text-brand-red" />
                <span className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Trending</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-1.5 md:gap-2 justify-end">
                {tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center rounded-full border border-black/5 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 transition-colors hover:border-brand-red/40 hover:text-brand-red dark:border-white/5 dark:bg-white/[0.03] dark:text-gray-400"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <div className="mb-8 flex flex-col gap-5 border-b border-black/10 pb-6 dark:border-white/5 md:flex-row md:items-end md:justify-between">
                <h3 className={`${sectionTitleClass} flex items-center gap-4 !text-3xl uppercase`}>
                  <span className="h-6 w-6 bg-brand-red shadow-lg shadow-brand-red/20" />
                  {searchQuery ? `Hasil Pencarian: ${searchQuery}` : `Berita ${resolveCategoryName(categoryFilter, categoriesTree)}`}
                </h3>
                <div className="hidden items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 md:flex">
                  <span className="inline-flex items-center gap-2 text-brand-red">
                    <span className="h-2 w-2 rounded-full bg-brand-red" />
                    Update Langsung
                  </span>
                </div>
              </div>

              {showSavedFeed ? (
                <SavedArticlesFeed site={siteParam} />
              ) : mainFeed.length > 0 ? (
                <div className="space-y-10 md:space-y-12">
                  {featuredFeed.length > 0 && (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8">
                      {featuredFeed.map((article: any) => (
                        <NewsCard key={article.id} article={article} site={siteParam} priority={true} />
                      ))}
                    </div>
                  )}

                  {showInlineSponsor && (
                    <div className="rounded-3xl border border-black/5 bg-brand-surface/80 p-7 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="mb-6 flex items-center justify-between">
                        <span className={sectionEyebrowMutedClass}>Sponsorship</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Advertisement</span>
                      </div>
                      <AdSpace type="in-feed" className="mx-auto" />
                    </div>
                  )}

                  {streamFeed.length > 0 && (
                    <div>
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <span className={`${sectionEyebrowClass} text-brand-red`}>Berita Lanjutan</span>
                        <Link
                          href={`/${siteParam}`}
                          className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-brand-red dark:text-white md:inline-flex"
                        >
                          Lihat Arsip
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {streamFeed.map((article: any) => (
                          <NewsCard key={article.id} article={article} variant="medium" site={siteParam} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-16 rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 p-10 text-center dark:border-white/10 dark:bg-white/[0.02]">
                  <p className="text-lg font-serif font-black text-brand-black dark:text-white">Belum ada berita untuk konteks ini.</p>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Coba kembali ke topik terbaru atau gunakan kata kunci yang lebih umum.
                  </p>
                  <div className="mt-6">
                    <Link
                      href={`/${siteParam}`}
                      className="inline-flex items-center justify-center rounded-full bg-brand-red px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                    >
                      Kembali Ke Berita Terbaru
                    </Link>
                  </div>
                </div>
              )}

              {!showSavedFeed && (
                <div className="mt-12 border-t border-black/5 pt-12 dark:border-white/5">
                  <LoadMoreArticles siteId={siteConfig.id} category={categoryFilter} search={searchQuery} initialPage={1} />
                </div>
              )}
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <div className="rounded-3xl border border-white/5 bg-slate-950 p-5 text-white shadow-[0_28px_56px_rgba(2,6,23,0.26)] md:p-6">
                <div className="pb-2">
                  <span className={`${sectionEyebrowClass} text-brand-red`}>Akses Redaksi</span>
                  <h4 className="mt-3 text-2xl font-serif font-black leading-tight text-white">
                    Pilih jalur tercepat ke redaksi.
                  </h4>
                </div>

                <div className="mt-5 grid gap-3">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 transition-colors hover:bg-emerald-500/15"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                          <SiWhatsapp size={18} />
                        </span>
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/90">WhatsApp</span>
                          <span className="mt-1 block text-sm font-bold text-white">Gabung Channel</span>
                        </span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}

                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4 transition-colors hover:bg-sky-400/15"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                          <SiTelegram size={18} />
                        </span>
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-sky-200/90">Telegram</span>
                          <span className="mt-1 block text-sm font-bold text-white">Ikuti Kanal</span>
                        </span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-sky-200 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}

                  <a
                    href={reportUrl}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition-colors hover:bg-white/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                        <Mail size={18} />
                      </span>
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Email</span>
                        <span className="mt-1 block text-sm font-bold text-white">Kirim Email</span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-white transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>

              {showPopularSidebar && (
                <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.02] md:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Star size={18} className="fill-brand-red text-brand-red" />
                    <h4 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Paling Populer</h4>
                  </div>
                  <div className="flex flex-col">
                    {popular.map((article: any, index: number) => (
                      <Link
                        key={article.id}
                        href={`/${siteParam}/artikel/${article.slug}`}
                        className="group flex items-start gap-4 border-b border-black/5 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/5"
                      >
                        <span className="tabular-nums font-serif text-[2.4rem] font-black leading-none tracking-[-0.05em] text-gray-100 transition-colors group-hover:text-brand-red dark:text-white/5">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-brand-red/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                              {index === 0 ? 'Top Story' : 'Trending'}
                            </span>
                            <span className={sectionMetaClass}>
                              {formatSidebarDate(article.publishedAt || article.createdAt)}
                            </span>
                          </div>
                          <h5 className="line-clamp-2 font-serif text-[1.08rem] font-black leading-[1.16] tracking-[-0.03em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                            {article.title}
                          </h5>
                          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-brand-text-muted dark:text-gray-400">
                            <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                            <span className="font-black uppercase tracking-[0.12em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                              Baca
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.02] md:p-6">
                <div className="mb-5">
                  <span className={`${sectionEyebrowClass} text-brand-red`}>Info Pasar</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3 last:border-b-0 last:pb-0 dark:border-white/5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">IHSG</div>
                      <div className="text-[1.1rem] font-black text-brand-black dark:text-white">7,452.80</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-500">
                        <span>↑</span>
                        <span>+1.25%</span>
                      </div>
                      <div className="text-[10px] text-gray-400">+92.30</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-black/5 pb-3 last:border-b-0 last:pb-0 dark:border-white/5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">USD/IDR</div>
                      <div className="text-[1.1rem] font-black text-brand-black dark:text-white">15,890</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-500">
                        <span>↓</span>
                        <span>-0.45%</span>
                      </div>
                      <div className="text-[10px] text-gray-400">-71.50</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Emas (gram)</div>
                      <div className="text-[1.1rem] font-black text-brand-black dark:text-white">Rp 1,125,000</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-500">
                        <span>↑</span>
                        <span>+0.18%</span>
                      </div>
                      <div className="text-[10px] text-gray-400">+2,000</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.02] md:p-6">
                {siteSettings?.featuredVideo ? (
                  <div>
                    <div className="mb-5">
                      <span className={`${sectionEyebrowClass} text-brand-red`}>Pilihan Visual</span>
                    </div>
                    <VideoWidget
                      title={siteSettings.featuredVideo.title}
                      thumbnail={siteSettings.featuredVideo.thumbnail}
                      duration={siteSettings.featuredVideo.duration}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-5">
                      <span className={`${sectionEyebrowClass} text-brand-red`}>Partner Placement</span>
                    </div>
                    <AdSpace type="rectangle" />
                  </div>
                )}
              </div>
            </aside>
          </div>

          {showEditorialExtras && (
            <div className="mt-16 space-y-16 border-t border-black/5 pt-16 dark:border-white/5 md:mt-24 md:space-y-20">
              {showEditorChoice && (
                <ScrollAnimate>
                  <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="fill-amber-500 text-amber-500" />
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Pilihan Editor</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {editorChoice.map((article: any) => (
                      <div key={article.id} className="transition-all duration-300 hover:shadow-xl">
                        <NewsCard article={article} variant="medium" site={siteParam} />
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}

              {showOpinionSection && (
                <ScrollAnimate>
                  <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-red"></span>
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Opini & Analisis</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {opinionAnalisis.map((article: any, idx: number) => (
                      <div key={article.id} className="flex h-full flex-col justify-between gap-4">
                        <div>
                          <span className={`${sectionMetaClass} mb-2 block uppercase tracking-[0.12em]`}>Kolom Analisis</span>
                          <Link href={`/${siteParam}/artikel/${article.slug}`}>
                            <h4 className="mb-2 line-clamp-3 text-xl font-serif font-black leading-tight text-brand-black transition-colors hover:text-brand-red dark:text-white">
                              &ldquo;{article.title}&rdquo;
                            </h4>
                          </Link>
                          <p className="line-clamp-3 text-sm font-light leading-relaxed text-gray-500 dark:text-gray-400">
                            {article.excerpt || article.blocks?.find((b: any) => b.type === 'paragraph')?.content || ''}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4 dark:border-white/5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red/10 text-[10px] font-black text-brand-red">
                            {article.author?.name?.charAt(0) || 'S'}
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-black dark:text-white">
                            {article.author?.name || 'Redaksi'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}

              {showPhotoSection && (
                <ScrollAnimate>
                  <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-red"></span>
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Foto Jurnalistik</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {photojournalism.map((article: any) => (
                      <div key={article.id} className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lg">
                        {article.featuredImage && (
                          <img src={article.featuredImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-[5s] group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                        <div className="absolute bottom-0 left-0 z-10 w-full p-6">
                          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-red">Jurnal Foto</span>
                          <h4 className="line-clamp-3 text-base font-serif font-black leading-snug text-white">{article.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}

              {showVideoSection && (
                <ScrollAnimate className="rounded-3xl bg-slate-950 px-6 py-8 text-white md:px-8 md:py-12">
                  <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="fill-red-500 text-red-500" />
                      <h3 className={`${sectionEyebrowClass} tracking-[0.14em] text-white`}>Laporan Video Eksklusif</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {videoStories.map((article: any) => (
                      <div key={article.id} className="group relative aspect-video overflow-hidden rounded-2xl bg-black shadow-lg">
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/60">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110 group-hover:border-transparent group-hover:bg-brand-red">
                            <span className="ml-1 text-lg text-white">▶</span>
                          </div>
                        </div>
                        {article.featuredImage && (
                          <img src={article.featuredImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-[4s] group-hover:scale-105" />
                        )}
                        <div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-5">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-red">Video Report</span>
                          <h4 className="line-clamp-2 text-sm font-bold text-white">{article.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}
            </div>
          )}
        </Container>
      </main>
    </PublicSiteLayout>
  )
}
