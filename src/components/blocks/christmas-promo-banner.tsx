'use client';

import { Link } from '@/i18n/navigation';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function ChristmasPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden border-b border-red-800 bg-red-700 text-white dark:bg-red-800">
      <div className="container-base py-4 flex flex-row items-center justify-center gap-4 text-center">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-transparent shadow-sm">
          <Image
            src="/christmas-tree.svg"
            alt="Christmas tree"
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <p className="text-base md:text-lg font-medium tracking-tight">
          Christmas Special Offer - Get 30% Off for all Subscription · Ends Dec 31
        </p>
        <Link
          href="/pricing"
          className="px-5 py-2 rounded-full bg-white text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
        >
          Grab now
        </Link>
        <button
          type="button"
          aria-label="Close promotion banner"
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
