'use client';

import { useEffect, useRef, useState } from 'react';

type LazySectionProps = {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  className?: string;
};

export function LazySection({
  children,
  placeholder = null,
  rootMargin = '800px',
  className,
}: LazySectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const element = containerRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}
