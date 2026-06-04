import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, CalendarDays, Eye, FileText, User2 } from 'lucide-react'
import { SITE_MAP } from '@beritakarya/config'
import PublicSiteLayout from '../../../../components/layout/PublicSiteLayout'
import { Container } from '../../../../components/layout/Container'
import NewsCard from '../../../../components/ui/NewsCard'
import { ROLE_LABELS } from '../../../../lib/constants'

interface Props {
  params: { site: string; id: string }
}

interface AuthorProfileResponse {
  profile: {
    id: string
    name: string
    role: string
    bio: string | null
    createdAt: string
  }
  stats: {
    publishedCount: number
    totalViews: number
  }
  recentArticles: any[]
}

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

async function getAuthorProfile(siteId: string, authorId: string): Promise<AuthorProfileResponse | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/users/public/${authorId}?site=${siteId}`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

function getFallbackBio(name: string, role: string, siteName: string) {
  const roleLabel = ROLE_LABELS[role] || 'Penulis'
  return `${name} merupakan ${roleLabel.toLowerCase()} di ${siteName} yang aktif menyajikan informasi secara akurat, ringkas, dan relevan bagi pembaca.`
}

function formatJoinDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams?.site || 'pusat'
  const authorId = resolvedParams?.id
  
  const [profileData, siteSettings] = await Promise.all([
    getAuthorProfile(siteParam, authorId),
    getSiteSettings(siteParam)
  ])

  const fallbackConfig = SITE_MAP[siteParam] || SITE_MAP.pusat
  const siteName = siteSettings?.name || fallbackConfig?.name || 'BeritaKarya'
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico'

  if (!profileData) {
    return {
      title: 'Profil Penulis Tidak Ditemukan',
      description: 'Profil penulis yang Anda cari tidak tersedia.',
      icons: faviconUrl
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const title = `${profileData.profile.name} - Profil Penulis ${siteName}`
  const description = (profileData.profile.bio || getFallbackBio(profileData.profile.name, profileData.profile.role, siteName)).slice(0, 160)
  const url = `${baseUrl}/${siteParam}/penulis/${authorId}`

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url,
      siteName: siteName,
      locale: 'id_ID',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@beritakarya',
    },
    icons: faviconUrl,
  }
}

export default async function AuthorProfilePage({ params }: Props) {
  const resolvedParams = await params
  const siteParam = resolvedParams?.site || 'pusat'
  const authorId = resolvedParams?.id

  const [siteSettings, profileData] = await Promise.all([
    getSiteSettings(siteParam),
    getAuthorProfile(siteParam, authorId),
  ])

  if (!profileData) notFound()

  const siteConfig = {
    id: siteParam,
    name: siteSettings?.name || SITE_MAP[siteParam]?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain: siteSettings?.domain || SITE_MAP[siteParam]?.domain || `${siteParam}.beritakarya.co`,
    description: siteSettings?.description || SITE_MAP[siteParam]?.description || `Portal berita resmi ${siteParam}.`,
    footerText: siteSettings?.footerText || SITE_MAP[siteParam]?.footerText || `© ${new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.`,
    address: siteSettings?.address || SITE_MAP[siteParam]?.address || 'Jl. Merdeka No. 123, Jakarta Pusat, Indonesia',
    contactEmail: siteSettings?.contactEmail || SITE_MAP[siteParam]?.contactEmail || 'support.beritakarya@gmail.com',
    phone: siteSettings?.phone || SITE_MAP[siteParam]?.phone || null,
    socialLinks: siteSettings?.socialLinks || SITE_MAP[siteParam]?.socialLinks || {},
    appearance: siteSettings?.appearance || SITE_MAP[siteParam]?.appearance || { primaryColor: '#e11d48' },
    trendingTopics: siteSettings?.trendingTopics || [],
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const { profile, stats, recentArticles } = profileData
  const roleLabel = ROLE_LABELS[profile.role] || 'Penulis'
  const bio = profile.bio || getFallbackBio(profile.name, profile.role, siteConfig.name)
  const joinedAt = formatJoinDate(profile.createdAt)
  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const featuredArticle = recentArticles[0]
  const remainingArticles = recentArticles.slice(1)

  return (
    <PublicSiteLayout siteConfig={siteConfig}>
      <main className="min-h-screen bg-[var(--bg-main)] dark:bg-[#020617]">
        <section className="relative overflow-hidden border-b border-gray-100 bg-white pt-20 dark:border-white/5 dark:bg-slate-950 md:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.12),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.04))] dark:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.03))]" />
          <Container>
            <div className="pb-12 md:pb-16">
              <Link
                href={`/${siteParam}/penulis`}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-brand-red"
              >
                <ArrowLeft size={14} />
                Kembali ke Halaman Penulis
              </Link>

              <div className="mt-6 inline-flex items-center rounded-full border border-brand-red/15 bg-brand-red/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                Profil Editorial
              </div>

              {/* Profile header — full width, no sidebar */}
              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 md:gap-12">
                {/* Avatar */}
                <div className="shrink-0 text-center sm:text-left">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-brand-red/10 bg-gradient-to-br from-brand-red to-red-700 text-2xl font-serif font-black text-white shadow-[0_20px_50px_rgba(225,29,72,0.22)] md:h-24 md:w-24 md:text-3xl">
                    {initials}
                  </div>
                  <div className="mt-3">
                    <span className="inline-block rounded-lg bg-brand-red/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-brand-red">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Name + Bio */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-brand-red" />
                      Bergabung sejak {joinedAt}
                    </span>
                  </div>

                  <h1 className="mt-3 text-3xl font-serif font-black tracking-[-0.04em] text-brand-black dark:text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem] xl:leading-[1.04]">
                    {profile.name}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[0.95rem] md:leading-relaxed">
                    {bio}
                  </p>
                </div>
              </div>

              {/* Stats strip — horizontal, balanced */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-lg">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                    <FileText size={11} className="text-brand-red" />
                    Artikel Terbit
                  </div>
                  <p className="mt-2 text-xl font-black text-brand-black dark:text-white">
                    {stats.publishedCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                    <Eye size={11} className="text-brand-red" />
                    Total Dilihat
                  </div>
                  <p className="mt-2 text-xl font-black text-brand-black dark:text-white">
                    {formatCompactNumber(stats.totalViews)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                    <CalendarDays size={11} className="text-brand-red" />
                    Kanal
                  </div>
                  <p className="mt-2 text-base font-black text-brand-black dark:text-white">
                    {siteConfig.name}
                  </p>
                </div>
              </div>

              {/* Editorial note — slim, inline strip */}
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.02] sm:max-w-lg">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Seluruh artikel telah melalui proses kurasi, verifikasi, dan standar editorial jaringan BeritaKarya.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-14 md:py-20">
          <Container>
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                Arsip Penulis
              </p>
              <h2 className="mt-3 text-3xl font-serif font-black tracking-[-0.04em] text-brand-black dark:text-white md:text-4xl">
                Tulisan terbaru dari {profile.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                Kumpulan artikel terbaru yang memperlihatkan fokus liputan, konsistensi publikasi, dan jejak editorial penulis di {siteConfig.name}.
              </p>
            </div>

            {recentArticles.length > 0 ? (
              <div className="mt-8 space-y-8">
                {/* Featured article — full width */}
                {featuredArticle && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.03] md:p-6">
                    <NewsCard article={featuredArticle} variant="medium" site={siteParam} priority />
                  </div>
                )}

                {/* Remaining articles — clean 3-col grid */}
                {remainingArticles.length > 0 && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">Publikasi Lainnya</span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {remainingArticles.map((article) => (
                        <div key={article.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-white/[0.03]">
                          <NewsCard article={article} variant="minimal" site={siteParam} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-10 rounded-[2rem] border border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.02]">
                <User2 size={34} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Belum ada artikel terbit dari penulis ini.
                </p>
              </div>
            )}
          </Container>
        </section>
      </main>
    </PublicSiteLayout>
  )
}
