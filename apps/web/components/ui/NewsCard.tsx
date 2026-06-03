'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import { SmartImage, prefetchImage } from './SmartImage';
import { cn } from '../../lib/utils';
import EditorialBadge from './EditorialBadge';
import { resolveArticleBadge } from '../../lib/resolveArticleBadge';
import { getCategoryColor } from '../../lib/constants';
import ArticleBookmarkButton from './ArticleBookmarkButton';

interface NewsCardProps {
  article: any;
  variant?: 'large' | 'medium' | 'minimal' | 'horizontal';
  site?: string;
  priority?: boolean;
}

export default function NewsCard({ article, variant = 'medium', site = 'pusat', priority = false }: NewsCardProps) {
  const imageUrl = article.featuredImage || article.blocks?.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg';
  const excerpt = article.blocks?.find((b: any) => b.type === 'paragraph')?.content || '';
  const articleHref = `/${site}/artikel/${article.slug}`;
  const date = new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const readTime = article.readingTimeMin ? `${article.readingTimeMin} min baca` : "3 min baca";
  const badgeVariant = resolveArticleBadge(article);
  const authorName = article.author?.name || 'Redaksi';
  const categoryLabelClass = cn(
    "rounded-sm px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
    getCategoryColor(article.category?.name)
  );
  const calmMetaClass = "flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-brand-text-muted dark:text-gray-400";
  const defaultImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.03]';
  const horizontalImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.04]';
  const heroImageClass = 'object-cover object-[center_26%] opacity-75 transition-all duration-700 ease-out group-hover:scale-[1.03]';

  if (variant === 'large') {
    return (
      <div className="relative">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-5 top-5 z-10 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm hover:border-white/20 hover:text-white"
          activeClassName="absolute right-5 top-5 z-10 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
          idleClassName="absolute right-5 top-5 z-10 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white/80 hover:border-white/20 hover:text-white"
          iconSize={16}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
          <motion.article 
            whileHover={{ y: -2 }}
            className="group relative h-[550px] min-h-[450px] w-full cursor-pointer overflow-hidden rounded-3xl bg-slate-900 shadow-2xl lg:h-[700px]"
          >
            <SmartImage 
              src={imageUrl} 
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="hero_lead"
              alt={article.title} 
              fill
              className={heroImageClass}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            
            <div className="absolute bottom-0 left-0 w-full max-w-4xl p-8 pb-32 md:p-12 md:pb-16 lg:p-14">
              <div className="mb-5 flex items-center gap-3">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="md" />}
                <span className="inline-block rounded-sm bg-brand-red px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h2 className="mb-5 max-w-[12ch] text-balance font-serif text-[2.35rem] font-black leading-[1.02] tracking-[-0.045em] text-white md:text-[3.15rem] lg:text-[4.05rem]">
                {article.title}
              </h2>
              <p className="mb-7 max-w-3xl line-clamp-2 text-base font-normal leading-relaxed text-gray-300 opacity-90 md:text-[1.05rem]">
                {excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-white/10 pt-5 text-[11px] font-semibold text-white/70">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-[11px] font-black text-white">
                    {authorName[0] || 'R'}
                  </div>
                  <span>{authorName}</span>
                </div>
                <span className="flex items-center gap-1.5"><Clock size={14}/> {date}</span>
                <span className="flex items-center gap-1.5"><BookOpen size={14}/> {readTime}</span>
              </div>
            </div>
          </motion.article>
        </Link>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-0 top-4 z-10 h-10 w-10 justify-center rounded-full border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          activeClassName="absolute right-0 top-4 z-10 h-10 w-10 justify-center rounded-full border border-brand-red/40 bg-brand-red/5 text-brand-red"
          idleClassName="absolute right-0 top-4 z-10 h-10 w-10 justify-center rounded-full border border-gray-200 bg-white text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10 dark:bg-white/[0.03]"
          iconSize={15}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
          <div className="py-5 pr-14 border-b border-gray-100 dark:border-white/5 last:border-0 group cursor-pointer flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="mb-2.5 flex items-center gap-2">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className={categoryLabelClass}>
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h3 className="line-clamp-3 font-serif text-[1.12rem] font-black leading-[1.18] tracking-[-0.03em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[1.2rem]">
                {article.title}
              </h3>
              <div className={cn(calmMetaClass, "mt-3")}>
                <span>{authorName}</span>
                <span className="opacity-30">•</span>
                <span>{date}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="relative">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-0 top-0 z-10 h-10 w-10 justify-center rounded-full border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          activeClassName="absolute right-0 top-0 z-10 h-10 w-10 justify-center rounded-full border border-brand-red/40 bg-brand-red/5 text-brand-red"
          idleClassName="absolute right-0 top-0 z-10 h-10 w-10 justify-center rounded-full border border-gray-200 bg-white text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10 dark:bg-white/[0.03]"
          iconSize={15}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
          <motion.article 
            whileHover={{ x: 2 }}
            className="group flex cursor-pointer gap-5 border-b border-gray-100 pb-6 pr-14 dark:border-white/5 md:gap-6 last:border-0"
          >
            <div className="relative aspect-[4/3] w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5 md:w-44">
              <SmartImage 
                src={imageUrl} 
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="card_horizontal"
                alt={article.title} 
                fill
                className={horizontalImageClass}
                priority={priority}
              />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                {badgeVariant && <EditorialBadge variant={badgeVariant} />}
                <span className={categoryLabelClass}>
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h3 className="line-clamp-3 font-serif text-[1.24rem] font-black leading-[1.15] tracking-[-0.035em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[1.4rem]">
                {article.title}
              </h3>
              <p className="hidden line-clamp-2 text-sm leading-relaxed text-brand-text-muted/90 dark:text-gray-400 md:block">
                {excerpt}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-brand-text-muted dark:text-gray-400">
                 <span className="flex min-w-0 items-center gap-1"><User size={10}/> <span className="truncate">{authorName}</span></span>
                 <span>{date}</span>
              </div>
            </div>
          </motion.article>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <ArticleBookmarkButton
        article={article}
        site={site}
        className="absolute right-3 top-3 z-10 h-10 w-10 justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm"
        activeClassName="absolute right-3 top-3 z-10 h-10 w-10 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
        idleClassName="absolute right-3 top-3 z-10 h-10 w-10 justify-center rounded-full border border-white/20 bg-black/45 text-white/85 hover:text-white hover:border-white/35"
        iconSize={15}
      />
      <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
        <motion.article 
          whileHover={{ y: -4 }}
          className="group relative flex cursor-pointer flex-col gap-4 md:gap-5"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5">
            <SmartImage 
              src={imageUrl} 
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="card"
              alt={article.title} 
              fill
              className={defaultImageClass}
              priority={priority}
            />
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {badgeVariant && <EditorialBadge variant={badgeVariant} />}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <span className={categoryLabelClass}>
                {article.category?.name || 'UMUM'}
              </span>
            </div>
            <h3 className="line-clamp-3 font-serif text-[1.55rem] font-black leading-[1.12] tracking-[-0.035em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[1.68rem]">
              {article.title}
            </h3>
            <p className="line-clamp-2 text-sm font-normal leading-relaxed text-brand-text-muted opacity-80 dark:text-gray-400">
              {excerpt}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-brand-text-muted dark:text-gray-400">
               <div className="flex min-w-0 items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold dark:bg-white/10">
                    {authorName[0] || 'R'}
                  </div>
                 <span className="truncate">{authorName}</span>
               </div>
               <span className="opacity-30">•</span>
               <span>{date}</span>
               <span className="opacity-30">•</span>
               <span className="flex items-center gap-1"><BookOpen size={12}/> {readTime}</span>
            </div>
          </div>
        </motion.article>
      </Link>
    </div>
  );
}
