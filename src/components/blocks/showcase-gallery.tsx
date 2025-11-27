'use client';

import { ChevronLeft, ChevronRight, Loader2, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

// 展示项类型
type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  category: string;
  title: string;
  filename?: string;
};

// 默认展示项（作为后备）
const DEFAULT_ITEMS: GalleryItem[] = [
  {
    id: 'default-1',
    type: 'image',
    category: 'Showcase',
    url: '/showcase/changemode_output.png',
    title: 'Showcase Item',
  },
];

// 视频项组件，用于处理缩略图截取
function VideoGalleryItem({
  item,
  thumbnail,
  onThumbnailCapture,
}: {
  item: GalleryItem;
  thumbnail?: string;
  onThumbnailCapture: (itemId: string, thumbnailUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 确保视频自动播放
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 确保视频设置为静音（浏览器要求）
      video.muted = true;
      video.setAttribute('playsinline', 'true');

      // 如果视频已经加载，尝试播放
      if (video.readyState >= 2) {
        video.play().catch((error) => {
          console.warn(`Video autoplay failed for ${item.url}:`, error);
        });
      } else {
        // 等待视频可以播放
        const handleCanPlayOnce = () => {
          video.play().catch((error) => {
            console.warn(`Video autoplay failed for ${item.url}:`, error);
          });
          video.removeEventListener('canplay', handleCanPlayOnce);
        };
        video.addEventListener('canplay', handleCanPlayOnce, { once: true });
      }
    }
  }, [item.url]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && !thumbnail) {
      const video = videoRef.current;

      // 确保视频在第一帧
      video.currentTime = 0;

      // 尝试播放
      video.play().catch((error) => {
        console.warn(`Video play failed for ${item.url}:`, error);
      });

      // 截取缩略图（用于 poster）
      const captureThumbnail = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            onThumbnailCapture(item.id, thumbnailUrl);
          } catch (error) {
            console.warn(`Failed to capture thumbnail for ${item.url}:`, error);
          }
        }
      };

      // 等待视频可以绘制
      if (video.readyState >= 2) {
        requestAnimationFrame(() => {
          requestAnimationFrame(captureThumbnail);
        });
      } else {
        const handleSeeked = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(captureThumbnail);
          });
          video.removeEventListener('seeked', handleSeeked);
        };
        video.addEventListener('seeked', handleSeeked, { once: true });
      }
    }
  };

  const handleCanPlay = () => {
    const video = videoRef.current;
    if (video) {
      // 确保视频正在播放
      if (video.paused) {
        video.play().catch((error) => {
          console.warn(`Video play failed on canplay for ${item.url}:`, error);
        });
      }
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`Error loading video ${item.url}:`, e);
  };

  return (
    <div className="w-[220px] md:w-[280px] flex-none aspect-[3/4] relative group/card rounded-xl overflow-hidden cursor-pointer snap-center border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-100 dark:bg-slate-800">
      <video
        ref={videoRef}
        src={item.url}
        poster={thumbnail} // 使用缩略图作为 poster，但不替换视频
        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 bg-black"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <span className="text-white font-bold text-base transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
          {item.title}
        </span>
        <span className="text-xs text-white/80 transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 delay-75">
          {item.category}
        </span>
        <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-current" />
        </div>
      </div>
    </div>
  );
}

export function ShowcaseGallery() {
  const t = useTranslations('showcaseGallery');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 从 API 加载展示项
  useEffect(() => {
    async function loadShowcaseItems() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/showcase?placement=landing', {
          cache: 'no-store',
        });
        const data = await response.json();

        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          const parsedItems: GalleryItem[] = data.items.map((item: any) => ({
            id: item.id,
            type: item.type === 'video' ? 'video' : 'image',
            url: item.url,
            category: item.category || 'Showcase',
            title: item.title || 'Showcase Item',
            filename: item.filename,
          }));
          const merged: GalleryItem[] = [...DEFAULT_ITEMS];
          for (const item of parsedItems) {
            if (!merged.some((existing) => existing.id === item.id)) {
              merged.push(item);
            }
          }
          setGalleryItems(merged);
        } else {
          console.warn('No showcase items found, using default items');
          setGalleryItems(DEFAULT_ITEMS);
        }
      } catch (error) {
        console.error('Failed to load showcase items:', error);
        // 使用默认展示项作为后备
        setGalleryItems(DEFAULT_ITEMS);
      } finally {
        setIsLoading(false);
      }
    }

    loadShowcaseItems();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleScroll = () => {
    handleManualScroll(); // 手动滚动时暂停自动滚动
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const cardWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 300 : 240;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  const scrollToItem = (index: number) => {
    setIsPaused(true);
    if (scrollRef.current && typeof window !== 'undefined') {
      const cardWidth = window.innerWidth >= 768 ? 300 : 240;
      scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    }
    // 3秒后恢复自动滚动
    setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  const handleThumbnailCapture = (itemId: string, thumbnailUrl: string) => {
    setVideoThumbnails((prev) => ({ ...prev, [itemId]: thumbnailUrl }));
  };

  // 自动滚动功能
  useEffect(() => {
    if (isLoading || galleryItems.length === 0 || isPaused) {
      // 清除自动滚动
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current && !isPaused) {
          const container = scrollRef.current;
          const scrollAmount = 1; // 每次滚动1px，实现平滑滚动
          const maxScroll = container.scrollWidth - container.clientWidth;

          if (container.scrollLeft >= maxScroll - 1) {
            // 滚动到末尾，重置到开头
            container.scrollTo({ left: 0, behavior: 'auto' });
          } else {
            // 继续向右滚动
            container.scrollBy({ left: scrollAmount, behavior: 'auto' });
          }
        }
      }, 16); // 约60fps
    };

    // 延迟启动，确保DOM已渲染
    const timeoutId = setTimeout(startAutoScroll, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isLoading, galleryItems.length, isPaused]);

  // 处理鼠标悬停暂停自动滚动
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // 处理手动滚动暂停自动滚动
  const handleManualScroll = () => {
    setIsPaused(true);
    // 3秒后恢复自动滚动
    setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  return (
    <section className="section-base bg-alt relative group">
      <div className="container-base">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="h2-section">
              {t('title')} <span className="text-teal-500">{t('titleHighlight')}</span>
            </h2>
            <p className="text-sm text-body">{t('description')}</p>
          </div>
        </div>

        <div
          className="relative px-4 md:px-12"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            onClick={() => {
              setIsPaused(true);
              scroll('left');
              setTimeout(() => setIsPaused(false), 3000);
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-all duration-300 hover:scale-110 hover:border-teal-500 hover:text-teal-500 hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPaused(true);
              scroll('right');
              setTimeout(() => setIsPaused(false), 3000);
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-all duration-300 hover:scale-110 hover:border-teal-500 hover:text-teal-500 hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-5 overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 snap-x"
                style={{ scrollBehavior: 'auto' }} // 自动滚动时使用 auto，手动滚动时使用 smooth
              >
                {galleryItems.map((item) =>
                  item.type === 'video' ? (
                    <VideoGalleryItem
                      key={item.id}
                      item={item}
                      thumbnail={videoThumbnails[item.id]}
                      onThumbnailCapture={handleThumbnailCapture}
                    />
                  ) : (
                    <div
                      key={item.id}
                      className="w-[220px] md:w-[280px] flex-none aspect-[3/4] relative group/card rounded-xl overflow-hidden cursor-pointer snap-center border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        loading="lazy"
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span className="text-white font-bold text-base transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
                          {item.title}
                        </span>
                        <span className="text-xs text-white/80 transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 delay-75">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {galleryItems.length > 0 && (
                <div className="flex justify-center gap-2 mt-4">
                  {galleryItems.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => scrollToItem(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        activeIndex === idx
                          ? 'w-8 h-2 bg-teal-500'
                          : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-teal-500/50'
                      }`}
                      aria-label={`Go to item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
