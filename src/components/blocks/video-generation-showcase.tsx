'use client';

import {
  Camera,
  Check,
  Clock,
  Cpu,
  Film,
  Loader2,
  Maximize2,
  Pause,
  Play,
  Ratio,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

// 视频演示项类型
type VideoDemo = {
  id: string; // 使用 hash 作为 ID，所以是字符串类型
  category: string;
  input: string;
  video: string;
  prompt: string;
  views: string;
  ratio: string;
  filename?: string;
};

// 默认演示项（作为后备）
const DEFAULT_DEMOS: VideoDemo[] = [
  {
    id: 'default-1',
    category: 'Apparel',
    input:
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800',
    video: '/video/lipstick.mp4',
    prompt: 'Cinematic slow motion of woman in floral dress walking through meadow at golden hour',
    views: '2.4M',
    ratio: '9:16',
  },
];

export function VideoGenerationShowcase() {
  const t = useTranslations('videoGenerationShowcase');
  const [veoDemos, setVeoDemos] = useState<VideoDemo[]>(DEFAULT_DEMOS);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Apparel');
  const [activeDemo, setActiveDemo] = useState<VideoDemo>(DEFAULT_DEMOS[0]);
  const categories = Array.from(new Set(veoDemos.map((d) => d.category)));
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // 默认静音
  const [autoLoop, setAutoLoop] = useState(true); // 默认开启自动循环
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [videoProgress, setVideoProgress] = useState(0); // 视频播放进度 (0-100)
  const [videoDuration, setVideoDuration] = useState(0); // 视频总时长（秒）
  const [currentTime, setCurrentTime] = useState(0); // 当前播放时间（秒）
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const processingThumbnailsRef = useRef<Set<string>>(new Set());

  // 格式化时间显示 (秒 -> MM:SS) - 提前定义以确保在所有地方都可以访问
  const formatTime = (seconds: number): string => {
    if (!seconds || Number.isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 从 API 加载视频列表
  useEffect(() => {
    async function loadVideos() {
      try {
        setIsLoadingVideos(true);
        const response = await fetch('/api/v1/videos');
        const data = await response.json();

        if (data.success && data.videos && data.videos.length > 0) {
          setVeoDemos(data.videos);
          // 设置第一个视频为活动演示项
          setActiveDemo(data.videos[0]);
          // 设置第一个分类为活动分类
          const firstCategory = data.videos[0]?.category || 'Apparel';
          setActiveCategory(firstCategory);
        } else {
          console.warn('No videos found, using default demos');
          setVeoDemos(DEFAULT_DEMOS);
        }
      } catch (error) {
        console.error('Failed to load videos:', error);
        // 使用默认演示项作为后备
        setVeoDemos(DEFAULT_DEMOS);
      } finally {
        setIsLoadingVideos(false);
      }
    }

    loadVideos();
  }, []);

  // 当视频列表更新时，更新活动演示项
  useEffect(() => {
    if (veoDemos.length > 0 && !veoDemos.find((d) => d.id === activeDemo.id)) {
      setActiveDemo(veoDemos[0]);
      setActiveCategory(veoDemos[0]?.category || 'Apparel');
    }
  }, [veoDemos]);

  // 截取视频第一帧作为缩略图
  const captureVideoThumbnail = (video: HTMLVideoElement, demoId: string): void => {
    // 如果已经有缩略图，直接返回
    if (videoThumbnails[demoId]) {
      return;
    }

    const captureThumbnail = () => {
      try {
        // 确保视频已加载并可以绘制
        if (!video.videoWidth || !video.videoHeight) {
          console.warn(`Video ${demoId} dimensions not available`);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Failed to get canvas context');
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 将视频当前帧（第一帧）绘制到 canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 转换为 base64 图片
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        setVideoThumbnails((prev) => {
          const updated = { ...prev, [demoId]: thumbnailUrl };
          console.log(`Thumbnail captured for demo ${demoId}`, updated);
          return updated;
        });
      } catch (error) {
        console.error(`Failed to capture video thumbnail for demo ${demoId}:`, error);
      }
    };

    // 确保视频在第一帧
    video.currentTime = 0;

    // 如果视频已经可以播放，立即截取
    if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
      // 等待视频帧渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          captureThumbnail();
        });
      });
    } else {
      // 等待视频可以播放
      const handleCanPlay = () => {
        video.currentTime = 0;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureThumbnail();
          });
        });
        video.removeEventListener('canplay', handleCanPlay);
      };

      const handleLoadedData = () => {
        video.currentTime = 0;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureThumbnail();
          });
        });
        video.removeEventListener('loadeddata', handleLoadedData);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);
    }
  };

  const handleDemoChange = (demo: VideoDemo) => {
    setActiveDemo(demo);
    setIsGenerating(false);
    setProgress(0);
    setVideoProgress(0);
    setCurrentTime(0);
    setVideoDuration(0);
    if (videoRef.current) {
      videoRef.current.load();
      // 确保新视频也遵循静音设置
      videoRef.current.muted = isMuted;
      // 自动播放新视频
      videoRef.current.play().catch((err) => {
        console.warn('Auto-play prevented:', err);
      });
    }
    setIsPlaying(true);
  };

  // 移除动态宽度计算，使用 flex-1 让中间区域自适应
  // 视频会在容器内居中显示，不会强制固定宽度

  // 为所有视频截取缩略图（包括队列中的视频）
  useEffect(() => {
    if (isLoadingVideos || veoDemos.length === 0) return;

    // 为队列中的所有视频截取缩略图
    veoDemos.forEach((demo) => {
      // 如果已经有缩略图或正在处理，跳过
      if (videoThumbnails[demo.id] || processingThumbnailsRef.current.has(demo.id)) {
        return;
      }

      // 标记为正在处理
      processingThumbnailsRef.current.add(demo.id);

      // 创建一个临时视频元素来加载并截取缩略图
      const tempVideo = document.createElement('video');
      tempVideo.src = demo.video;
      tempVideo.muted = true;
      tempVideo.preload = 'metadata';
      tempVideo.playsInline = true;
      tempVideo.setAttribute('playsinline', 'true');
      // 对于同源视频，不需要设置 crossOrigin，否则可能导致 CORS 错误

      let captured = false;
      let timeoutId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        try {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          tempVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
          tempVideo.removeEventListener('canplay', handleCanPlay);
          tempVideo.removeEventListener('loadeddata', handleLoadedData);
          tempVideo.removeEventListener('seeked', handleSeeked);
          tempVideo.removeEventListener('error', handleError);
          tempVideo.src = '';
          tempVideo.load();
          if (tempVideo.parentNode) {
            tempVideo.remove();
          }
        } catch (_e) {
          // 忽略清理错误
        }
      };

      const captureTempThumbnail = () => {
        // 防止重复捕获
        if (captured) {
          cleanup();
          return;
        }

        try {
          // 确保视频有尺寸信息
          if (!tempVideo.videoWidth || !tempVideo.videoHeight) {
            console.warn(
              `Video ${demo.id} (${demo.filename || demo.video}) dimensions not available yet`
            );
            return;
          }

          // 确保视频在第一帧
          if (Math.abs(tempVideo.currentTime) > 0.1) {
            tempVideo.currentTime = 0;
            return; // 等待 seeked 事件
          }

          // 等待一帧以确保视频帧已渲染
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              try {
                if (captured) {
                  cleanup();
                  return;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                  console.error(`Failed to get canvas context for demo ${demo.id}`);
                  captured = true;
                  processingThumbnailsRef.current.delete(demo.id);
                  cleanup();
                  return;
                }

                canvas.width = tempVideo.videoWidth;
                canvas.height = tempVideo.videoHeight;

                // 绘制视频帧到 canvas
                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

                // 转换为 base64 图片
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

                setVideoThumbnails((prev) => {
                  if (!prev[demo.id]) {
                    console.log(
                      `✅ Thumbnail captured for queue item ${demo.id} (${demo.category}) - ${demo.filename || demo.video}`
                    );
                    captured = true;
                    processingThumbnailsRef.current.delete(demo.id);
                    cleanup();
                    return { ...prev, [demo.id]: thumbnailUrl };
                  }
                  return prev;
                });
              } catch (error) {
                console.error(`Failed to draw thumbnail for demo ${demo.id}:`, error);
                captured = true;
                processingThumbnailsRef.current.delete(demo.id);
                cleanup();
              }
            });
          });
        } catch (error) {
          console.error(`Failed to capture thumbnail for demo ${demo.id}:`, error);
          captured = true;
          processingThumbnailsRef.current.delete(demo.id);
          cleanup();
        }
      };

      // 处理视频加载完成事件
      const handleLoadedMetadata = () => {
        tempVideo.currentTime = 0;
      };

      const handleCanPlay = () => {
        if (tempVideo.readyState >= 2) {
          tempVideo.currentTime = 0;
          // 延迟一下确保帧已渲染
          setTimeout(() => {
            if (!captured) {
              captureTempThumbnail();
            }
          }, 50);
        }
      };

      const handleLoadedData = () => {
        if (tempVideo.readyState >= 2) {
          tempVideo.currentTime = 0;
          setTimeout(() => {
            if (!captured) {
              captureTempThumbnail();
            }
          }, 50);
        }
      };

      const handleSeeked = () => {
        if (tempVideo.readyState >= 2 && tempVideo.videoWidth && tempVideo.videoHeight) {
          captureTempThumbnail();
        }
      };

      const handleError = (e: Event) => {
        const videoElement = e.target as HTMLVideoElement;
        const error = videoElement.error;
        let errorMessage = 'Unknown error';

        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading aborted';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video';
              break;
            case error.MEDIA_ERR_DECODE:
              errorMessage = 'Video decoding error';
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported';
              break;
            default:
              errorMessage = `Error code: ${error.code}`;
          }
        }

        console.warn(
          `⚠️ Failed to load video for thumbnail: ${demo.filename || demo.video} (ID: ${demo.id})\n` +
            `   Error: ${errorMessage}\n` +
            `   Video path: ${demo.video}`
        );
        captured = true;
        processingThumbnailsRef.current.delete(demo.id);
        cleanup();
      };

      // 添加事件监听器
      tempVideo.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      tempVideo.addEventListener('canplay', handleCanPlay, { once: true });
      tempVideo.addEventListener('loadeddata', handleLoadedData, { once: true });
      tempVideo.addEventListener('seeked', handleSeeked, { once: true });
      tempVideo.addEventListener('error', handleError, { once: true });

      // 开始加载视频
      console.log(
        `🔄 Loading video for thumbnail: ${demo.filename || demo.video} (ID: ${demo.id})`
      );
      tempVideo.load();

      // 超时处理：如果 5 秒后还没捕获到，放弃
      timeoutId = setTimeout(() => {
        if (!captured) {
          console.warn(
            `⏱️ Timeout capturing thumbnail for demo ${demo.id} (${demo.filename || demo.video})\n` +
              `   Video readyState: ${tempVideo.readyState}\n` +
              `   Video dimensions: ${tempVideo.videoWidth}x${tempVideo.videoHeight}`
          );
          captured = true;
          processingThumbnailsRef.current.delete(demo.id);
          cleanup();
        }
      }, 5000);
    });
  }, [veoDemos, isLoadingVideos]); // 移除 videoThumbnails 从依赖项，使用 ref 来跟踪处理状态

  // 当当前视频加载完成时，为其截取缩略图
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      // 确保视频遵循静音设置
      video.muted = isMuted;

      const handleCanPlay = () => {
        captureVideoThumbnail(video, activeDemo.id);
      };

      // 如果视频已经可以播放，立即处理
      if (video.readyState >= 2) {
        handleCanPlay();
      } else {
        video.addEventListener('canplay', handleCanPlay, { once: true });
      }

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [activeDemo.id, isMuted]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const firstInCat = veoDemos.find((d) => d.category === cat);
    if (firstInCat) handleDemoChange(firstInCat);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleAutoLoop = () => {
    setAutoLoop(!autoLoop);
  };

  // 获取当前视频在队列中的下一个视频
  const getNextVideo = () => {
    const currentIndex = veoDemos.findIndex((d) => d.id === activeDemo.id);
    if (currentIndex === -1) return null;

    // 如果当前是最后一个，循环到第一个
    const nextIndex = (currentIndex + 1) % veoDemos.length;
    return veoDemos[nextIndex];
  };

  // 处理视频播放结束
  const handleVideoEnded = () => {
    if (autoLoop) {
      const nextVideo = getNextVideo();
      if (nextVideo) {
        // 延迟一小段时间再切换，让用户看到视频结束
        setTimeout(() => {
          handleDemoChange(nextVideo);
        }, 300);
      }
    }
  };

  const handleGenerate = () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setStage(t('stageInitializing'));
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();

    const duration = 4000;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      if (newProgress < 25) setStage(t('stageAnalyzing'));
      else if (newProgress < 50) setStage(t('stageGenerating'));
      else if (newProgress < 75) setStage(t('stageInterpolating'));
      else setStage(t('stageFinalizing'));

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(0);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsPlaying(true);
          }
        }, 500);
      }
    }, intervalTime);
  };

  return (
    <section id="video-sample" className="section-base bg-main scroll-mt-20">
      <div className="container-base">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="h2-section">
              {t('title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">
                {t('titleHighlight')}
              </span>
            </h2>
            <p className="text-body max-w-xl text-sm md:text-base">{t('description')}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-slate-300 font-sans ring-1 ring-white/10 lg:h-[650px] flex flex-col">
          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 flex flex-col h-full flex-shrink-0">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> {t('source')}
                </h3>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
              </div>

              <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        activeCategory === cat
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.1)]'
                          : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-700 group bg-slate-800 shadow-inner">
                    {videoThumbnails[activeDemo.id] ? (
                      <img
                        src={videoThumbnails[activeDemo.id]}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-50"
                        alt={t('videoThumbnail')}
                      />
                    ) : (
                      <img
                        src={activeDemo.input}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-50"
                        alt={t('input')}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <div className="bg-slate-900/80 p-3 rounded-full border border-white/10 backdrop-blur">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="bg-black/60 backdrop-blur text-[10px] font-mono text-white px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" /> {t('ready')}
                      </span>
                      <span className="bg-teal-500/90 backdrop-blur text-[10px] font-bold text-white px-2 py-1 rounded border border-teal-400/50 uppercase tracking-wider">
                        {activeDemo.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-[100px] bg-black/20 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> {t('prompt')}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {activeDemo.prompt.length} chars
                    </span>
                  </div>
                  <textarea
                    readOnly
                    className="w-full h-full bg-transparent text-sm text-slate-300 font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar"
                    value={activeDemo.prompt}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-800 bg-slate-900 relative z-10 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 group border border-white/10 ${isGenerating ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                      {t('generateVideo')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CENTER PANEL */}
            <div
              ref={videoContainerRef}
              className="bg-[#0f172a] relative flex flex-col h-full flex-1 min-w-0"
            >
              <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-500 tracking-widest">
                      {t('recording')}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <Ratio className="w-3 h-3" />{' '}
                    {activeDemo.ratio === '9:16' ? '1080x1920' : '1920x1080'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">
                  {videoDuration > 0 ? formatTime(videoDuration) : '--:--'}
                </div>
              </div>

              <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {isGenerating && (
                  <div className="absolute inset-0 z-50 bg-[#0f172a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-all duration-300">
                    <div className="relative w-32 h-32 mb-8">
                      <div className="absolute inset-0 border-2 border-slate-800 rounded-full" />
                      <div className="absolute inset-0 border-2 border-teal-500 rounded-full border-t-transparent animate-spin" />
                      <div className="absolute inset-4 border-2 border-slate-700 rounded-full" />
                      <div
                        className="absolute inset-4 border-2 border-blue-500 rounded-full border-b-transparent animate-spin opacity-70"
                        style={{ animationDirection: 'reverse', animationDuration: '3s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-8 h-8 text-white animate-pulse" />
                      </div>
                    </div>

                    <h4 className="text-2xl font-bold text-white tracking-tight mb-2">
                      {Math.round(progress)}%
                    </h4>
                    <p className="text-teal-500 font-mono text-xs uppercase tracking-widest mb-8 animate-pulse">
                      {stage}
                    </p>

                    <div className="w-64 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            progress >= i * 25
                              ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]'
                              : progress >= (i - 1) * 25 + 10
                                ? 'bg-teal-500/50'
                                : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-8 font-mono text-[10px] text-slate-500 space-y-1 text-center opacity-70">
                      <div>&gt; {t('engineInitialized')}</div>
                      <div className={progress > 20 ? 'text-slate-400' : 'hidden'}>
                        {' '}
                        &gt; {t('geometryInference')}
                      </div>
                      <div className={progress > 50 ? 'text-slate-400' : 'hidden'}>
                        {' '}
                        &gt; {t('physicsSimulation')}
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-full relative flex items-center justify-center overflow-hidden px-4">
                  <video
                    key={activeDemo.id}
                    ref={videoRef}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="h-full w-auto rounded-lg shadow-2xl"
                    style={{
                      maxWidth: '100%',
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleVideoEnded}
                    onLoadedMetadata={() => {
                      // 视频会在容器内自适应显示，不需要手动计算宽度
                      if (videoRef.current) {
                        setVideoDuration(videoRef.current.duration || 0);
                      }
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        const current = videoRef.current.currentTime;
                        const duration = videoRef.current.duration || 1;
                        setCurrentTime(current);
                        setVideoProgress((current / duration) * 100);
                      }
                    }}
                    onCanPlay={() => {
                      if (videoRef.current) {
                        captureVideoThumbnail(videoRef.current, activeDemo.id);
                        if (videoRef.current.duration) {
                          setVideoDuration(videoRef.current.duration);
                        }
                      }
                    }}
                  >
                    <source src={activeDemo.video} type="video/mp4" />
                  </video>

                  {/* 隐藏的 canvas 用于截取缩略图 */}
                  <canvas ref={thumbnailCanvasRef} className="hidden" />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div
                      className={`w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform transition-all duration-300 shadow-2xl ${isPlaying && !isGenerating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'} ${isGenerating ? 'hidden' : ''}`}
                    >
                      <Play className="w-8 h-8 fill-white text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0 cursor-pointer z-20" onClick={togglePlay} />
                </div>
              </div>

              <div className="h-14 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-4 flex-shrink-0">
                <button
                  onClick={togglePlay}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
                <div
                  className="flex-1 h-12 flex items-center group cursor-pointer"
                  onClick={(e) => {
                    if (videoRef.current && videoDuration > 0) {
                      const progressBar = e.currentTarget.querySelector(
                        '.progress-bar-container'
                      ) as HTMLElement;
                      if (progressBar) {
                        const rect = progressBar.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                        const newTime = percentage * videoDuration;
                        videoRef.current.currentTime = newTime;
                        setCurrentTime(newTime);
                        setVideoProgress(percentage * 100);
                      }
                    }
                  }}
                >
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative progress-bar-container">
                    <div
                      className="absolute top-0 left-0 h-full bg-teal-500 group-hover:bg-teal-400 transition-all duration-150"
                      style={{ width: `${videoProgress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: `calc(${videoProgress}% - 6px)` }}
                    />
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500 tabular-nums min-w-[80px] text-right">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </div>
                <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                  <button
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition-colors"
                    title={isMuted ? t('unmute') : t('mute')}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 fill-current" />
                    ) : (
                      <Volume2 className="w-4 h-4 fill-current" />
                    )}
                  </button>
                  <button
                    onClick={toggleAutoLoop}
                    className={`text-[10px] font-mono transition-colors ${
                      autoLoop
                        ? 'text-teal-400 hover:text-teal-300'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                    title={autoLoop ? t('disableAutoLoop') : t('enableAutoLoop')}
                  >
                    {t('autoLoop')}
                  </button>
                  {autoLoop && (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  )}
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-80 lg:flex-shrink-0 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-3.5 h-3.5" /> {t('queue')}
                </h3>
                <span className="text-[10px] text-slate-600">
                  {veoDemos.length} {t('items')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isLoadingVideos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                  </div>
                ) : (
                  veoDemos.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleDemoChange(demo)}
                      className={`w-full text-left group rounded-xl overflow-hidden border transition-all duration-300 ${
                        activeDemo.id === demo.id
                          ? 'border-teal-500 ring-1 ring-teal-500/30 bg-slate-800'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="h-32 w-full relative overflow-hidden bg-black/50">
                        {videoThumbnails[demo.id] ? (
                          <img
                            src={videoThumbnails[demo.id]}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            alt={t('videoThumbnail')}
                          />
                        ) : (
                          <img
                            src={demo.input}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            alt={t('thumbnail')}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                        {activeDemo.id === demo.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-teal-500/10 backdrop-blur-[1px]">
                            <div className="w-10 h-10 rounded-full bg-teal-500/90 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                          <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                            {demo.ratio}
                          </span>
                          <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                            <Sparkles className="w-3 h-3 text-teal-400" />
                            {demo.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors">
                          {demo.prompt}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" /> 00:05
                          <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                          {demo.views} {t('views')}
                        </div>
                      </div>
                    </button>
                  ))
                )}

                <div className="pt-2">
                  <button className="w-full py-3 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 border-dashed hover:border-slate-600 flex items-center justify-center gap-2">
                    <Upload className="w-3 h-3" /> {t('addMediaToQueue')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
