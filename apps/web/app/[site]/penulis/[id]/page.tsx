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
            <div className="pb-14 md:pb-20">
              <Link
                href={`/${siteParam}/penulis`}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-brand-red"
              >
                <ArrowLeft size={14} />
                Kembali ke Halaman Penulis
              </Link>

              <div className="mt-8 inline-flex items-center rounded-full border border-brand-red/15 bg-brand-red/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                Profil Editorial
              </div>

              <div className="relative mt-8 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1.35fr)_22rem] xl:items-start xl:gap-12">
                <div className="min-w-0">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] border border-brand-red/10 bg-gradient-to-br from-brand-red to-red-700 text-2xl font-serif font-black text-white shadow-[0_24px_60px_rgba(225,29,72,0.18)] md:h-24 md:w-24 md:text-3xl">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                        <span>{roleLabel}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/15" />
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={13} className="text-brand-red" />
                          Bergabung sejak {joinedAt}
                        </span>
                      </div>

                      <h1 className="mt-4 max-w-4xl text-4xl font-serif font-black tracking-[-0.045em] text-brand-black dark:text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem] xl:leading-[0.97]">
                        {profile.name}
                      </h1>

                      <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-[1.05rem] md:leading-8">
                        {bio}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                        <FileText size={13} className="text-brand-red" />
                        Artikel Terbit
                      </div>
                      <p className="mt-3 text-2xl font-black text-brand-black dark:text-white">
                        {stats.publishedCount.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                        <Eye size={13} className="text-brand-red" />
                        Total Dilihat
                      </div>
                      <p className="mt-3 text-2xl font-black text-brand-black dark:text-white">
                        {formatCompactNumber(stats.totalViews)}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                        <CalendarDays size={13} className="text-brand-red" />
                        Kanal
                      </div>
                      <p className="mt-3 text-lg font-black text-brand-black dark:text-white">
                        {siteConfig.name}
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.03] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                      Ringkasan Profil
                    </p>
                    <dl className="mt-5 space-y-4">
                      <div className="border-b border-gray-100 pb-4 dark:border-white/5">
                        <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                          Peran
                        </dt>
                        <dd className="mt-2 text-sm font-bold text-brand-black dark:text-white">
                          {roleLabel}
                        </dd>
                      </div>
                      <div className="border-b border-gray-100 pb-4 dark:border-white/5">
                        <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                          Rekam Publikasi
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {stats.publishedCount.toLocaleString('id-ID')} artikel dengan total {stats.totalViews.toLocaleString('id-ID')} pembacaan publik.
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                          Status Editorial
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Profil ini tampil sebagai bagian dari tim penulis resmi {siteConfig.name}.
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[1.75rem] border border-gray-100 bg-brand-black p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-white/5 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                      Catatan Redaksi
                    </p>
                    <p className="mt-4 text-sm leading-7 text-gray-300">
                      Seluruh artikel pada halaman ini telah tayang melalui proses kurasi, verifikasi, dan standar editorial yang berlaku di jaringan BeritaKarya.
                    </p>
                  </div>
                </aside>
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
              <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_22rem] xl:items-start">
                <div className="min-w-0 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.03] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:p-6">
                  {featuredArticle && (
                    <NewsCard article={featuredArticle} variant="medium" site={siteParam} priority />
                  )}
                </div>

                <aside className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.03] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:p-6">
                  <div className="border-b border-gray-100 pb-4 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                      Arsip Terbaru
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-brand-black dark:text-white">
                      Publikasi lain
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Daftar tulisan lain dari penulis ini dalam format yang lebih ringkas dan mudah dipindai.
                    </p>
                  </div>

                  <div className="mt-2">
                    {remainingArticles.length > 0 ? (
                      remainingArticles.map((article) => (
                        <NewsCard key={article.id} article={article} variant="minimal" site={siteParam} />
                      ))
                    ) : (
                      <div className="py-8">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          Saat ini baru ada satu artikel terbit yang tampil pada profil penulis ini.
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
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
