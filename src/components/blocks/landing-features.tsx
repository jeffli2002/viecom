'use client';

import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, FileSpreadsheet, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export function LandingFeatures() {
  const t = useTranslations('features');

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-violet-50 text-violet-700 border-violet-200">
            {t('badge')}
          </Badge>
          <h2 className="text-slate-900 mb-6" style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}>
            {t('title')}
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">{t('subtitle')}</p>
        </motion.div>

        {/* Feature 1 - Batch Generation */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700">
              <FileSpreadsheet className="size-4" />
              <span className="text-sm">{t('batch.badge')}</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('batch.title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">{t('batch.description')}</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('batch.benefit1.title')}</span>
                  <p className="text-slate-600">{t('batch.benefit1.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('batch.benefit2.title')}</span>
                  <p className="text-slate-600">{t('batch.benefit2.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('batch.benefit3.title')}</span>
                  <p className="text-slate-600">{t('batch.benefit3.desc')}</p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-violet-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                alt={t('batch.alt')}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <FileSpreadsheet className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">{t('batch.statLabel')}</div>
                  <div className="text-2xl text-slate-900">{t('batch.statValue')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 2 - Brand Analysis */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-2 md:order-1"
          >
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-fuchsia-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80"
                alt={t('brand.alt')}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </div>
            <div className="absolute -top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center">
                  <Wand2 className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">{t('brand.statLabel')}</div>
                  <div className="text-2xl text-slate-900">{t('brand.statValue')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 order-1 md:order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-100 text-fuchsia-700">
              <Wand2 className="size-4" />
              <span className="text-sm">{t('brand.badge')}</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('brand.title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">{t('brand.description')}</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('brand.benefit1.title')}</span>
                  <p className="text-slate-600">{t('brand.benefit1.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('brand.benefit2.title')}</span>
                  <p className="text-slate-600">{t('brand.benefit2.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('brand.benefit3.title')}</span>
                  <p className="text-slate-600">{t('brand.benefit3.desc')}</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Feature 3 - High Quality & Creativity */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700">
              <Award className="size-4" />
              <span className="text-sm">{t('quality.badge')}</span>
            </div>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
              {t('quality.title')}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">{t('quality.description')}</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('quality.benefit1.title')}</span>
                  <p className="text-slate-600">{t('quality.benefit1.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('quality.benefit2.title')}</span>
                  <p className="text-slate-600">{t('quality.benefit2.desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900">{t('quality.benefit3.title')}</span>
                  <p className="text-slate-600">{t('quality.benefit3.desc')}</p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-purple-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                alt={t('quality.alt')}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Award className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">{t('quality.statLabel')}</div>
                  <div className="text-2xl text-slate-900">{t('quality.statValue')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
