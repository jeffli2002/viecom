'use client';

import { Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                <Sparkles className="size-5 text-white" />
              </div>
            </div>
            <span className="text-white font-semibold">Viecom</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/image-generation"
              className="text-slate-400 hover:text-white transition-colors"
            >
              图片生成
            </Link>
            <Link
              href="/video-generation"
              className="text-slate-400 hover:text-white transition-colors"
            >
              视频生成
            </Link>
            <Link
              href="/batch-image-generation"
              className="text-slate-400 hover:text-white transition-colors"
            >
              批量生图
            </Link>
            <Link
              href="/batch-video-generation"
              className="text-slate-400 hover:text-white transition-colors"
            >
              批量生视频
            </Link>
            <Link href="/assets" className="text-slate-400 hover:text-white transition-colors">
              资产库
            </Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">
              定价
            </Link>
            <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
              关于我们
            </Link>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              隐私政策
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              服务条款
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Viecom. Crafted with AI ✨
          </p>
        </div>
      </div>
    </footer>
  );
}
