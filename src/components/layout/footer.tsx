import { Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function Footer() {
  return (
    <footer className="border-t border-gray-200/50 bg-muted/30 dark:border-gray-800/50">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Viecom</span>
            </div>
            <p className="text-sm text-muted-foreground">
              为电商企业提供高质量的AI图片和视频生成服务
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">产品</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/image-generation" className="text-muted-foreground hover:text-primary">
                  图片生成
                </Link>
              </li>
              <li>
                <Link href="/video-generation" className="text-muted-foreground hover:text-primary">
                  视频生成
                </Link>
              </li>
              <li>
                <Link href="/batch-image-generation" className="text-muted-foreground hover:text-primary">
                  批量生图
                </Link>
              </li>
              <li>
                <Link href="/batch-video-generation" className="text-muted-foreground hover:text-primary">
                  批量生视频
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">资源</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/assets" className="text-muted-foreground hover:text-primary">
                  资产库
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-primary">
                  文档
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary">
                  定价
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">公司</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Viecom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
