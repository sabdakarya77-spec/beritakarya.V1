'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';

interface AdSpaceProps {
  type: 'leaderboard' | 'rectangle' | 'in-feed';
  slot?: 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in_feed';
  label?: string;
  className?: string;
}

export default function AdSpace({ 
  type, 
  slot,
  label = "Advertisement", 
  className = ""
}: AdSpaceProps) {
  const params = useParams();
  const site = params?.site as string | undefined;
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | HTMLAnchorElement | null>(null);
  const trackedImpressionRef = useRef(false);

  // Allow UI to reuse the same visual format while targeting a different backend slot.
  const slotName = slot || (type === 'in-feed' ? 'in_feed' : type);

  useEffect(() => {
    let active = true;
    const fetchAd = async () => {
      try {
        const siteParam = site || 'pusat';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // Fetch active regional advertisements
        const res = await fetch(`${apiUrl}/api/v1/ads/public?site=${siteParam}`);
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success && json.data && active) {
          // Find ad matching the specific configured slot.
          const matchedAd = json.data.find((a: any) => a.slot === slotName);
          if (matchedAd) {
            setAd(matchedAd);
          }
        }
      } catch (error) {
        console.error('Gagal memuat iklan regional', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAd();
    return () => {
      active = false;
    };
  }, [site, slotName]);

  useEffect(() => {
    trackedImpressionRef.current = false;
  }, [ad?.id]);

  useEffect(() => {
    if (!ad?.id || trackedImpressionRef.current || !containerRef.current) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || trackedImpressionRef.current) return;

        trackedImpressionRef.current = true;
        fetch(`${apiUrl}/api/v1/ads/track/${ad.id}?action=impression`, {
          method: 'POST'
        }).catch(() => {});
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [ad?.id]);

  const handleAdClick = () => {
    if (!ad) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/api/v1/ads/track/${ad.id}?action=click`;
    // Pakai sendBeacon agar request tetap terkirim meski browser navigate away
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  };

  const styles = {
    leaderboard: "w-full h-24 md:h-[250px] mb-6",
    rectangle: "w-full h-[250px] mb-8",
    'in-feed': "w-full h-40 mb-12"
  };

  // Helper: check if file is a video
  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.toLowerCase().includes('video');
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-gray-50/50 dark:bg-white/[0.02] animate-pulse border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden",
        styles[type],
        className
      )}>
        <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">MEMUAT IKLAN...</span>
      </div>
    );
  }

  if (ad) {
    // 1. Script Ad (HTML Code from AdSense or other network)
    if (ad.code) {
      return (
        <div 
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className={cn("relative overflow-hidden flex items-center justify-center bg-transparent", styles[type], className)}
          dangerouslySetInnerHTML={{ __html: ad.code }}
        />
      );
    }

    // 2. Banner Creative Ad (Image or Video)
    if (ad.imageUrl) {
      const isVideo = isVideoFile(ad.imageUrl);

      return (
        <a 
          ref={containerRef as React.RefObject<HTMLAnchorElement>}
          href={ad.linkUrl || '#'} 
          onClick={handleAdClick}
          target="_blank" 
          rel="noopener noreferrer"
          className={cn(
            "block relative overflow-hidden group border border-gray-100 dark:border-white/10 bg-white dark:bg-black",
            styles[type],
            className
          )}
        >
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-brand-red px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white shadow-lg sm:left-3 sm:text-[8px] sm:tracking-[0.2em]">
            {label}
          </span>
          
          {isVideo ? (
            <video 
              src={ad.imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <img 
              src={ad.imageUrl} 
              alt={label} 
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </a>
      );
    }
  }

  // 3. Fallback: neutral placeholder for self-serve inventory
  return (
    <div
      className={cn(
        "border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-white/[0.02] text-center px-6",
        styles[type],
        className
      )}
    >
      <span className="absolute left-2 top-2 z-10 rounded-sm bg-brand-red px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white shadow-lg sm:left-3 sm:text-[8px] sm:tracking-[0.2em]">
        {label}
      </span>

      <div className="flex flex-col items-center justify-center gap-2 pt-7 sm:gap-3 sm:pt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 sm:text-[10px] sm:tracking-[0.24em]">
          Slot Iklan Mandiri
        </p>
        <div className="space-y-1">
          <h4 className="text-[13px] font-black text-brand-black dark:text-white tracking-tight sm:text-sm md:text-lg">
            Ruang promosi tersedia
          </h4>
          <p className="mx-auto max-w-[17rem] text-[10px] leading-5 text-gray-500 dark:text-gray-400 sm:max-w-sm md:text-xs">
            Slot ini disiapkan untuk banner atau script iklan mandiri dari dashboard ads.
          </p>
        </div>
      </div>
    </div>
  );
}
