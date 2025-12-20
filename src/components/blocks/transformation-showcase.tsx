'use client';

import {
  Box,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

type ScenarioId =
  | 'virtualTryOn'
  | 'modelSwap'
  | 'furnitureStaging'
  | 'sceneGeneration'
  | 'holidayCampaign';

const SCENARIO_CONFIGS = [
  {
    id: 'virtualTryOn' as ScenarioId,
    icon: Shirt,
    input1: { image: '/imagesgen/virtual_tryon_garment.png' },
    input2: { image: '/imagesgen/virtual_tryon_model.jpg' },
    result: '/imagesgen/virtual_tryon_output.png',
  },
  {
    id: 'modelSwap' as ScenarioId,
    icon: RefreshCw,
    input1: { image: '/imagesgen/changemodel1.jpg' },
    input2: { image: '/imagesgen/targetmodel.jpg' },
    result: '/imagesgen/changemode_output.png',
  },
  {
    id: 'furnitureStaging' as ScenarioId,
    icon: Box,
    input1: { image: '/imagesgen/chair.jpg' },
    input2: { image: '/imagesgen/livingroom.jpg' },
    result: '/imagesgen/furniture_output.png',
  },
  {
    id: 'sceneGeneration' as ScenarioId,
    icon: Camera,
    input1: { image: '/imagesgen/lotion.jpg' },
    input2: { image: '/imagesgen/stream.jpg' },
    result: '/imagesgen/scenechange_output.png',
  },
  {
    id: 'holidayCampaign' as ScenarioId,
    icon: Sparkles,
    input1: { image: '/imagesgen/candles.jpg' },
    input2: { image: '/imagesgen/christmas.jpg' },
    result: '/imagesgen/christmas_output.png',
  },
];

export function TransformationShowcase() {
  const t = useTranslations('transformationShowcase');
  const [activeIndex, setActiveIndex] = useState(0);
  const activeScenario = SCENARIO_CONFIGS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % SCENARIO_CONFIGS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + SCENARIO_CONFIGS.length) % SCENARIO_CONFIGS.length);
  };

  return (
    <section id="studio" className="section-base bg-main overflow-hidden">
      <div className="container-base relative z-10">
        <div className="text-center mb-16">
          <span className="text-teal-700 dark:text-teal-300 font-medium tracking-wider text-sm uppercase mb-2 block">
            {t('badge')}
          </span>
          <h2 className="h2-section">
            {t('title')} <span className="text-gradient">{t('titleHighlight')}</span>
          </h2>
          <p className="text-body max-w-2xl mx-auto">{t('description')}</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap justify-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            {SCENARIO_CONFIGS.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <button
                  type="button"
                  key={scenario.id}
                  onClick={() => setActiveIndex(index)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
                    activeIndex === index
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 hover:scale-105'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(`scenarios.${scenario.id}.title`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 lg:-left-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
            aria-label="Previous scenario"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 lg:-right-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
            aria-label="Next scenario"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="grid lg:grid-cols-12 gap-6 items-center max-w-7xl mx-auto min-h-[600px]">
            <div className="lg:col-span-5 space-y-6 relative z-20">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl opacity-20 blur transition duration-500 group-hover:opacity-40" />
                <div className="glass-card p-8 rounded-2xl relative shadow-2xl">
                  <div className="flex gap-4 items-center mb-8">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {t('inputAssets')}
                    </h3>
                  </div>

                  <div key={activeScenario.id} className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {t(`scenarios.${activeScenario.id}.input1Label`)}
                      </span>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                        <Image
                          src={activeScenario.input1.image}
                          alt="Input 1"
                          fill
                          sizes="(max-width: 768px) 45vw, 240px"
                          className="object-cover transition-transform duration-500 group-hover/input:scale-110"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {t(`scenarios.${activeScenario.id}.input2Label`)}
                      </span>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                        <Image
                          src={activeScenario.input2.image}
                          alt="Input 2"
                          fill
                          sizes="(max-width: 768px) 45vw, 240px"
                          className="object-cover transition-transform duration-500 group-hover/input:scale-110"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 pt-6">
                    <span>{t('supportedFormats')}</span>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" /> {t('highResReady')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl border border-teal-500/20 text-teal-700 dark:text-teal-300 relative">
                <Sparkles className="w-8 h-8" />
                <div className="absolute -inset-1 bg-teal-500/20 rounded-full blur animate-ping opacity-20" />
              </div>
              <div className="mt-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-lg border border-teal-500/20 shadow-lg">
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-widest">
                  {t('aiProcessing')}
                </span>
                <div className="text-[10px] text-slate-600 dark:text-slate-300 text-center">
                  {t('modelName')}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 lg:col-start-8 flex items-center justify-center z-10">
              <div className="relative w-full max-w-[380px] aspect-[4/5] group/result cursor-pointer">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-teal-500/50 transition-all duration-500 group-hover/result:shadow-teal-500/50 group-hover/result:shadow-2xl group-hover/result:scale-105 group-hover/result:border-teal-500">
                  <Image
                    src={activeScenario.result}
                    alt={t(`scenarios.${activeScenario.id}.title`)}
                    fill
                    priority
                    sizes="(max-width: 1024px) 70vw, 380px"
                    className="object-cover transition-transform duration-500 group-hover/result:scale-110"
                  />

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 pt-32 transition-all duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-lg shadow-teal-500/20">
                        {t('generatedResult')}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-2">
                      {t(`scenarios.${activeScenario.id}.title`)}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t(`scenarios.${activeScenario.id}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
