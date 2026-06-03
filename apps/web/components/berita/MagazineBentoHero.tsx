'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import { cn } from '../../lib/utils';
import { getCategoryColor } from '../../lib/constants';

type HeroArticle = {
  title?: string;
  slug?: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  category?: { name?: string | null } | null;
  blocks?: Array<{ type?: string; url?: string; width?: number; height?: number }>;
};

const getImageUrl = (article: HeroArticle) =>
  article.featuredImage || article.blocks?.find((block) => block.type === 'image')?.url || '/placeholder.jpg';

const getPrimaryImageBlock = (article: HeroArticle) => {
  const imageUrl = getImageUrl(article);

  return (
    article.blocks?.find((block) => block.type === 'image' && block.url === imageUrl) ||
    article.blocks?.find((block) => block.type === 'image')
  );
};

const getHeroImagePosition = (article: HeroArticle, variant: 'lead' | 'side') => {
  const imageBlock = getPrimaryImageBlock(article);
  const width = imageBlock?.width;
  const height = imageBlock?.height;

  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height;

    if (ratio < 0.9) {
      return variant === 'lead' ? '50% 20%' : '50% 16%';
    }

    if (ratio < 1.2) {
      return variant === 'lead' ? '50% 23%' : '50% 20%';
    }

    if (ratio > 1.8) {
      return variant === 'lead' ? '50% 30%' : '50% 26%';
    }
  }

  return variant === 'lead' ? '50% 26%' : '50% 22%';
};

export function MagazineBentoHero({ articles, site }: { articles: any[], site: string }) {
  if (!articles || articles.length === 0) return null;

  const lead = articles[0];
  const sideArticles = articles.slice(1, 4);

  return (
    <section className="relative mb-14 w-full md:mb-16 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-brand-red/5 dark:bg-brand-red/10 blur-[80px] -z-10 rounded-full" />
      
      <div className="grid h-auto grid-cols-1 gap-4 lg:h-[450px] lg:grid-cols-12 lg:gap-5 xl:h-[470px]">
        
        {lead && (
          <Link href={`/${site}/artikel/${lead.slug}`} className="group/lead relative block h-[300px] overflow-hidden rounded-2xl lg:col-span-8 lg:h-full">
            <SmartImage 
              src={getImageUrl(lead)} 
              blur={lead.featuredImageBlur}
              dominantColor={lead.featuredImageColor}
              context="hero_lead"
              alt={lead.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/lead:scale-[1.03]"
              style={{ objectPosition: getHeroImagePosition(lead, 'lead') }}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent min-h-[40%] sm:min-h-[45%] md:min-h-[50%]" />
            
            <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="mb-3 sm:mb-4">
                  <span className={cn("px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] rounded-sm shadow-sm", getCategoryColor(lead.category?.name))}>
                    {lead.category?.name || 'Headline'}
                  </span>
                </div>
                
                <h1 className="max-w-[16ch] sm:max-w-[18ch] md:max-w-[20ch] text-balance font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black leading-[1.1] tracking-[-0.03em] sm:tracking-[-0.04em] text-white">
                  {lead.title}
                </h1>
              </motion.div>
            </div>
          </Link>
        )}

        <div className="flex h-full flex-col gap-4 lg:col-span-4 lg:gap-5">
          {sideArticles.map((article: any) => (
            <Link 
              key={article.id} 
              href={`/${site}/artikel/${article.slug}`}
              className="group/side relative block min-h-[120px] sm:min-h-[142px] flex-1 overflow-hidden rounded-2xl border border-black/5 dark:border-white/5"
            >
              <SmartImage 
                src={getImageUrl(article)} 
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="hero_side"
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover/side:scale-[1.02]"
                style={{ objectPosition: getHeroImagePosition(article, 'side') }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-colors" />
              
              <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 lg:p-5">
                <div className="mb-1.5 sm:mb-2">
                  <span className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] px-1.5 sm:px-2 py-0.5 rounded-sm", getCategoryColor(article.category?.name))}>
                    {article.category?.name || 'Terkini'}
                  </span>
                </div>
                <h3 className="line-clamp-2 font-serif text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-black leading-[1.15] tracking-tight text-white">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
