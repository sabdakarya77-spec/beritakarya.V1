'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, FileText, ArrowRight, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'

interface Author {
  id: string
  name: string
  role: string
  bio: string | null
  createdAt: string
  publishedCount: number
  totalViews: number
}

interface AuthorsResponse {
  success: boolean
  data: Author[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const ITEMS_PER_PAGE = 12

export default function AuthorsPage() {
  const params = useParams()
  const siteId = params.site as string
  const siteName = siteId === 'pusat' ? 'Pusat' : siteId.charAt(0).toUpperCase() + siteId.slice(1)

  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'articles'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const res = await fetch(`${apiUrl}/api/v1/users/authors?site=${siteId}&limit=100`, {
          cache: 'no-store'
        })
        if (res.ok) {
          const json: AuthorsResponse = await res.json()
          setAuthors(json.data || [])
          setTotalPages(Math.ceil((json.data?.length || 0) / ITEMS_PER_PAGE))
        }
      } catch (err) {
        console.error('Failed to fetch authors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuthors()
  }, [siteId])

  // Filter and sort authors
  const filteredAuthors = authors
    .filter(author => 
      author.name.toLowerCase().includes(search.toLowerCase()) ||
      author.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'id')
      }
      if (sortBy === 'articles') {
        return b.publishedCount - a.publishedCount
      }
      // Default: recent (by createdAt)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // Paginate
  const paginatedAuthors = filteredAuthors.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}jt`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}rb`
    return views.toLocaleString('id-ID')
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-brand-surface pt-20 pb-12 dark:border-white/5 dark:bg-white/[0.02] md:pt-28 md:pb-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/8 px-4 py-1.5">
              <Users size={14} className="text-brand-red" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                Tim Editorial
              </span>
            </div>
            
            <h1 className="mt-6 text-4xl font-serif font-black tracking-tight text-brand-black dark:text-white sm:text-5xl lg:text-6xl">
              Para Penulis Kami
            </h1>
            
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Kenali tim redaksi dan kontributor yang menghadirkan berita berkualitas untuk Anda
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="border-b border-gray-100 bg-gray-50/50 py-4 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari penulis..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-brand-red/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition-all focus:border-brand-red/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              >
                <option value="recent">Terbaru</option>
                <option value="name">Nama A-Z</option>
                <option value="articles">Paling Aktif</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
            </div>
          ) : paginatedAuthors.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {search ? 'Penulis tidak ditemukan' : 'Belum ada penulis'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedAuthors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/${siteId}/penulis/${author.id}`}
                    className="group block"
                  >
                    <article className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-red/20 hover:shadow-md dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-brand-red/30">
                      {/* Avatar & Name */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-red to-red-700 text-lg font-black text-white shadow-lg shadow-brand-red/20">
                          {getInitials(author.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red">
                            {author.name}
                          </h3>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {ROLE_LABELS[author.role] || author.role}
                          </p>
                        </div>
                      </div>

                      {/* Bio Preview */}
                      {author.bio && (
                        <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                          {author.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <FileText size={12} className="text-brand-red" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {author.publishedCount} artikel
                          </span>
                        </div>
                        {author.totalViews > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">
                              {formatViews(author.totalViews)}x dilihat
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-red opacity-0 transition-opacity group-hover:opacity-100">
                        <span>Lihat Profil</span>
                        <ArrowRight size={12} />
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  >
                    ← Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "h-9 w-9 rounded-lg text-xs font-bold transition-all",
                            page === pageNum
                              ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                          )}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}