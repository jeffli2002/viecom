'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function LandingCTA() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-32 px-6 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-blue-600 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto max-w-4xl text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2
            className="text-white leading-tight"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
          >
            Ready to create stunning visuals?
          </h2>
          <p className="text-2xl text-violet-100 max-w-2xl mx-auto">
            Join 50,000+ brands using AI to transform their product photography
          </p>
          <div className="pt-4">
            {!mounted || !isAuthenticated ? (
              // Show default state during SSR to prevent hydration mismatch
              <Link href="/signup">
                <Button
                  size="lg"
                  className="gap-2 text-xl px-12 py-8 bg-white text-violet-600 hover:bg-slate-50 shadow-2xl"
                >
                  <Sparkles className="size-6" />
                  Start Creating Free
                  <ArrowRight className="size-6" />
                </Button>
              </Link>
            ) : (
              <Link href="/image-generation">
                <Button
                  size="lg"
                  className="gap-2 text-xl px-12 py-8 bg-white text-violet-600 hover:bg-slate-50 shadow-2xl"
                >
                  <Sparkles className="size-6" />
                  Start Creating Free
                  <ArrowRight className="size-6" />
                </Button>
              </Link>
            )}
          </div>
          <p className="text-violet-200">
            40 free credits · No credit card required · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
