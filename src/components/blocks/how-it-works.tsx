'use client';

import { Card } from '@/components/ui/card';
import { Download, Upload, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: Upload,
      title: t('step1Title'),
      description: t('step1Desc'),
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-200',
      hoverBorderColor: 'hover:border-blue-400',
      hoverShadowColor: 'hover:shadow-blue-500/20',
    },
    {
      icon: Wand2,
      title: t('step2Title'),
      description: t('step2Desc'),
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-200',
      hoverBorderColor: 'hover:border-purple-400',
      hoverShadowColor: 'hover:shadow-purple-500/20',
    },
    {
      icon: Download,
      title: t('step3Title'),
      description: t('step3Desc'),
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-200',
      hoverBorderColor: 'hover:border-green-400',
      hoverShadowColor: 'hover:shadow-green-500/20',
    },
  ];

  return (
    <section className="section-container relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-24">
      <div className="container relative">
        <div className="mb-16 text-center">
          <h2
            className="mb-4 font-bold tracking-tight text-slate-900"
            style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}
          >
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 md:text-xl">{t('subtitle')}</p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`group relative rounded-2xl border ${step.borderColor} ${step.hoverBorderColor} bg-white p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${step.hoverShadowColor} hover:-translate-y-2`}
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r ${step.color} text-base font-bold text-white shadow-lg`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-6 mt-4 flex justify-center">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl ${step.bgColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <step.icon className={`h-10 w-10 ${step.iconColor}`} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3 transition-colors group-hover:text-purple-600">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
