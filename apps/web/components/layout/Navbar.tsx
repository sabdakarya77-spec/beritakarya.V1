'use client';

import { Search, User as UserIcon, Bell, Moon, Sun, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import DateTimeWeather from '../ui/DateTimeWeather';
import { cn } from '../../lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Container } from './Container';

import { CategoryItem } from '../../lib/constants';
import { useSavedArticles } from '../../hooks/useSavedArticles';

interface NavbarProps {
  siteConfig: any;
  categories: CategoryItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

import { useAuthStore } from '../../store/authStore';

export default function Navbar({
  siteConfig,
  categories,
  selectedCategory,
  setSelectedCategory,
  onSearchClick,
  onMenuClick,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { user, logout } = useAuthStore();
  const activeSite = siteConfig?.id || pathname.split('/')[1] || 'pusat';
  const isArticlePage = pathname.includes('/artikel/');
  const { count: savedArticlesCount } = useSavedArticles(activeSite);
  const articleTopDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (!savedTheme) return;
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    // Always start in expanded mode after refresh or route navigation.
    setIsCollapsed(false);

    const handleScroll = () => {
      setIsCollapsed(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    // Navigate to homepage with category param
    router.push(`/${activeSite}?cat=${encodeURIComponent(cat)}`);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-500",
      isArticlePage
        ? "border-black/5 bg-[color:rgb(var(--brand-surface-rgb)/0.88)] backdrop-blur-xl shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-[rgba(2,6,23,0.84)]"
        : "border-black/5 bg-[var(--bg-main)] shadow-sm dark:border-white/5"
    )}>
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-12 opacity-100"
      )}>
      <div className="border-b border-black/5 dark:border-white/5">
        <Container className="flex h-9 items-center justify-between gap-4 text-[10px] font-medium text-brand-text-muted sm:h-10 sm:text-[11px]">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0 truncate">
              {isArticlePage ? (
                <span className="truncate text-[10px] normal-case tracking-[0.03em] text-brand-text-muted sm:text-[11px]">
                  {articleTopDate}
                </span>
              ) : (
                <DateTimeWeather />
              )}
            </div>
          </div>
        </Container>
      </div>
      </div>

      <div className={cn(
        "transition-all duration-300 ease-out",
        isCollapsed
          ? "max-h-0 overflow-hidden opacity-0 pointer-events-none"
          : "max-h-40 overflow-visible opacity-100"
      )}>
      <Container className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3",
        isArticlePage ? "min-h-[4.35rem] sm:min-h-[4.65rem] md:min-h-[4.95rem]" : "min-h-[4.65rem] sm:min-h-[4.95rem] md:min-h-[5.3rem]"
      )}>
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <button 
            onClick={onSearchClick}
            className="hidden rounded-full p-2 text-brand-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5 md:inline-flex"
            aria-label="Cari berita"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-w-0 justify-self-center"
        >
          <Link href={`/${activeSite}`} className="flex max-w-full flex-col items-center group">
            {siteConfig?.logoUrl ? (
              <div className="relative mb-0.5 h-8 w-[7.5rem] sm:h-10 sm:w-[10rem] md:h-[2.85rem] md:w-[11.5rem]">
                <SmartImage 
                  src={siteConfig.logoUrl} 
                  alt={siteConfig.name} 
                  fill 
                  context="logo"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <h1 className="text-center font-serif text-[1.45rem] font-black leading-none tracking-[-0.045em] sm:text-[2rem] md:text-[2.55rem]">
                <span className="text-brand-red group-hover:text-brand-red/90 transition-colors">BERITA</span>
                <span className="text-brand-black group-hover:opacity-90 transition-opacity">KARYA</span>
              </h1>
            )}
            <span className="mt-1 max-w-[8rem] text-center text-[9px] font-medium tracking-[0.05em] text-brand-text-muted transition-all sm:max-w-[240px] sm:text-[10px] sm:tracking-[0.08em]">
              Nusantara Berbicara 
            </span>
          </Link>
        </motion.div>

        <div className={cn("flex min-w-0 items-center justify-end gap-1 sm:gap-2 md:gap-3", isArticlePage && "md:gap-2.5")}>

          {!isArticlePage && (
            <button 
              aria-label="Notifikasi"
              className="hidden xl:flex rounded-full p-1.5 text-brand-text-muted transition-colors hover:bg-black/5 hover:text-brand-black"
            >
              <Bell size={16} strokeWidth={1.2} />
            </button>
          )}
            
          {user ? (
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 rounded-full p-1.5 text-brand-text-muted transition-colors hover:bg-black/5 hover:text-brand-black"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[88px] truncate text-[11px] font-semibold md:inline">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl dark:border-white/5 dark:bg-slate-900"
                  >
                    <div className="border-b border-black/5 p-4 dark:border-white/5">
                      <p className="text-xs font-bold text-brand-black dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      {['superadmin', 'wapimred', 'reporter', 'kontributor'].includes(user.role) && (
                        <Link 
                          href={`/${activeSite}/dashboard`}
                          className="block rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-red dark:text-gray-300 dark:hover:bg-white/5"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-brand-red transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Keluar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              href="/login"
              className="hidden items-center gap-1.5 rounded-full p-1.5 text-brand-text-muted transition-colors hover:bg-black/5 hover:text-brand-black sm:flex"
            >
              <UserIcon size={16} strokeWidth={1.2} />
              <span className="hidden text-[11px] font-semibold md:inline">Masuk</span>
            </Link>
          )}
          
          <div className="hidden h-5 w-px bg-black/10 dark:bg-white/10 md:block" />

          <button 
            className="rounded-full p-1 text-brand-text-muted/85 transition-colors hover:bg-black/5 hover:text-brand-black sm:p-2 sm:text-brand-text-muted" 
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </Container>
      </div>

      <div className="hidden border-t border-black/5 dark:border-white/5 md:block">
        <Container className={cn(
          "relative z-40 hidden items-center justify-center text-[10px] font-medium tracking-[0.04em] text-brand-text-muted md:flex lg:text-[11px]",
          isCollapsed
            ? "h-10 gap-3.5"
            : "h-12 gap-5"
        )}>
          {categories.map((cat, index) => {
          const isActive = selectedCategory === cat.slug || cat.subCategories?.some(sub => sub.slug === selectedCategory);
          const hasSub = cat.subCategories && cat.subCategories.length > 0;
          return (
            <div 
              key={cat.slug}
              className="relative flex items-center py-2.5"
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(cat.slug)}
                className={cn(
                  "group relative flex items-center gap-1 transition-all hover:text-brand-red dark:hover:text-white",
                  isActive ? "font-semibold text-brand-black dark:text-white" : "text-gray-500 dark:text-gray-500"
                )}
              >
                {cat.slug === 'tersimpan' && (
                  <Bookmark 
                    size={11} 
                    className={cn(
                      "transition-colors",
                      isActive ? "text-brand-red fill-brand-red/20" : "text-gray-400 dark:text-gray-500 group-hover:text-brand-red"
                    )} 
                  />
                )}
                <span>{cat.name}</span>
                {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-black tracking-normal text-white">
                    {savedArticlesCount}
                  </span>
                )}
                {isActive && (
                  <motion.span 
                    layoutId="activeCategoryLine"
                    className="absolute -bottom-[0.72rem] left-0 h-0.5 w-full bg-brand-red"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <span className="absolute -bottom-[0.72rem] left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full" />
                )}
              </motion.button>

              <AnimatePresence>
                {hoveredCategory === cat.name && hasSub && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-50 mt-1 flex min-w-[220px] -translate-x-1/2 flex-col gap-0.5 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                  >
                    {cat.subCategories?.map((sub) => {
                      const isSubActive = selectedCategory === sub.slug;
                      return (
                        <button
                          key={sub.slug}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(sub.slug);
                            setHoveredCategory(null);
                          }}
                          className={cn(
                            "group/sub flex items-center justify-between rounded-xl px-4 py-2 text-left text-[10px] font-medium tracking-[0.02em] transition-colors hover:bg-gray-50 dark:hover:bg-white/5 lg:text-[11px]",
                            isSubActive ? "text-brand-red bg-brand-red/5" : "text-gray-600 dark:text-gray-400 hover:text-brand-red dark:hover:text-white"
                          )}
                        >
                          <span>{sub.name}</span>
                          <span className={cn(
                            "w-1 h-1 rounded-full bg-brand-red scale-0 transition-transform group-hover/sub:scale-100",
                            isSubActive ? "scale-100" : ""
                          )} />
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
          })}
        </Container>
      </div>

      <div className="border-t border-black/5 dark:border-white/5 md:hidden">
        <Container className="md:hidden">
          <nav className={cn(
            "flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300",
            isCollapsed ? "pb-1.5 pt-1.5" : "pb-2.5 pt-2"
          )}>
            {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug || cat.subCategories?.some(sub => sub.slug === selectedCategory);
          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={cn(
                "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                        isCollapsed && "px-2.5 py-1 text-[10px]",
                isActive
                  ? "border-brand-red bg-brand-red/10 text-brand-red dark:text-white"
                  : "border-black/10 text-brand-text-muted dark:border-white/10 dark:text-gray-400"
              )}
            >
              {cat.slug === 'tersimpan' && (
                <Bookmark 
                  size={9} 
                  className={isActive ? "text-brand-red fill-brand-red/20" : "text-gray-400 dark:text-gray-400"} 
                />
              )}
              <span>{cat.name}</span>
              {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-brand-red px-1 py-0.5 text-[9px] font-black tracking-normal text-white">
                  {savedArticlesCount}
                </span>
              )}
            </button>
          );
            })}
          </nav>
        </Container>
      </div>

      {(() => {
        const activeParent = categories.find(cat => 
          cat.slug === selectedCategory || cat.subCategories?.some(sub => sub.slug === selectedCategory)
        );
        if (activeParent && activeParent.subCategories && activeParent.subCategories.length > 0) {
          return (
            <div className={cn(
              "border-t border-black/5 bg-black/[0.02] transition-all duration-300 md:hidden dark:border-white/5 dark:bg-white/[0.03]",
              isCollapsed && "border-transparent"
            )}>
              <Container className="md:hidden">
                <nav className={cn(
                  "flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300",
                  isCollapsed ? "pb-1.5 pt-1" : "pb-2.5 pt-1.5"
                )}>
                  {activeParent.subCategories.map((sub) => {
                    const isSubActive = selectedCategory === sub.slug;
                    return (
                      <button
                        key={sub.slug}
                        onClick={() => handleCategoryClick(sub.slug)}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-xl px-2.5 py-1 text-[10px] font-medium transition-all",
                          isCollapsed && "px-2 py-1 text-[9px]",
                          isSubActive
                            ? "bg-brand-red text-white"
                            : "bg-black/[0.04] text-gray-600 dark:bg-white/5 dark:text-gray-400"
                        )}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </nav>
              </Container>
            </div>
          );
        }
        return null;
      })()}
    </header>
  );
}
