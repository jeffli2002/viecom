'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Upload, Wand2, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section className="py-32 px-6 bg-white">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
            {t('badge') || '如何使用'}
          </Badge>
          <h2 className="text-slate-900 mb-6" style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}>
            {t('title')}
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Step 1 - Upload Data */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700">
              <Upload className="size-4" />
              <span className="text-sm font-medium">Step 1</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('step1Title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('step1Desc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-2xl flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-2/3 h-2/3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Excel/CSV File Icon */}
                <rect x="50" y="30" width="100" height="130" rx="8" fill="#3B82F6" opacity="0.2" />
                <rect x="50" y="30" width="100" height="130" rx="8" stroke="#3B82F6" strokeWidth="3" fill="none" />
                
                {/* File Lines */}
                <line x1="65" y1="55" x2="135" y2="55" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <line x1="65" y1="75" x2="135" y2="75" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <line x1="65" y1="95" x2="135" y2="95" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <line x1="65" y1="115" x2="105" y2="115" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                
                {/* Upload Arrow */}
                <path d="M100 180 L100 140" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 140 L90 150" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 140 L110 150" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                  <Upload className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">Excel/CSV</div>
                  <div className="text-2xl font-bold text-slate-900">100+</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Step 2 - AI Generation */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative md:order-2"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-2xl flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-2/3 h-2/3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Magic Wand */}
                <circle cx="100" cy="100" r="50" fill="#A855F7" opacity="0.1" />
                <circle cx="100" cy="100" r="35" fill="#A855F7" opacity="0.2" />
                
                {/* Wand */}
                <line x1="70" y1="130" x2="130" y2="70" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" />
                <circle cx="130" cy="70" r="8" fill="#A855F7" />
                
                {/* Sparkles */}
                <path d="M80 60 L82 68 L90 70 L82 72 L80 80 L78 72 L70 70 L78 68 Z" fill="#A855F7" />
                <path d="M130 110 L132 116 L138 118 L132 120 L130 126 L128 120 L122 118 L128 116 Z" fill="#A855F7" />
                <path d="M50 90 L51 94 L55 95 L51 96 L50 100 L49 96 L45 95 L49 94 Z" fill="#A855F7" />
                <path d="M145 45 L146 49 L150 50 L146 51 L145 55 L144 51 L140 50 L144 49 Z" fill="#A855F7" />
              </svg>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                  <Wand2 className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">AI Processing</div>
                  <div className="text-2xl font-bold text-slate-900">&lt; 5 min</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 md:order-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700">
              <Wand2 className="size-4" />
              <span className="text-sm font-medium">Step 2</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('step2Title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('step2Desc')}
            </p>
          </motion.div>
        </div>

        {/* Step 3 - Preview & Download */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700">
              <Download className="size-4" />
              <span className="text-sm font-medium">Step 3</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('step3Title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('step3Desc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-2xl flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-2/3 h-2/3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Download Icon */}
                <rect x="50" y="60" width="100" height="100" rx="12" fill="#10B981" opacity="0.1" />
                
                {/* Image Gallery Grid */}
                <rect x="60" y="70" width="35" height="35" rx="4" fill="#10B981" opacity="0.3" />
                <rect x="105" y="70" width="35" height="35" rx="4" fill="#10B981" opacity="0.3" />
                <rect x="60" y="115" width="35" height="35" rx="4" fill="#10B981" opacity="0.3" />
                <rect x="105" y="115" width="35" height="35" rx="4" fill="#10B981" opacity="0.3" />
                
                {/* Checkmarks */}
                <circle cx="77.5" cy="87.5" r="8" fill="#10B981" />
                <path d="M75 87.5 L77 89.5 L80 85.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                <circle cx="122.5" cy="87.5" r="8" fill="#10B981" />
                <path d="M120 87.5 L122 89.5 L125 85.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Download Arrow */}
                <path d="M100 175 L100 185" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 185 L95 180" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 185 L105 180" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">Ready</div>
                  <div className="text-2xl font-bold text-slate-900">100%</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
