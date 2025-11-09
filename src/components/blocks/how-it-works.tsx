'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Download, Upload, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: Upload,
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      icon: Wand2,
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      icon: Download,
      title: t('step3Title'),
      description: t('step3Desc'),
    },
  ];

  return (
    <section className="section-container relative overflow-hidden bg-background py-24">
      {/* Apple-style background */}
      <div className="-z-10 absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />
      </div>

      <div className="container relative">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold tracking-tight" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-gray-200 bg-white/80 p-8 text-center backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80"
              >
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
