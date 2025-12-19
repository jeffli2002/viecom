import { Box, Camera, Maximize2, RefreshCw, Shirt, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

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

export async function TransformationShowcase() {
  const t = await getTranslations('transformationShowcase');

  return (
    <section id="studio" className="section-base bg-main overflow-hidden">
      <div className="container-base relative z-10">
        <div className="text-center mb-16">
          <span className="text-teal-500 font-medium tracking-wider text-sm uppercase mb-2 block">
            {t('badge')}
          </span>
          <h2 className="h2-section">
            {t('title')} <span className="text-gradient">{t('titleHighlight')}</span>
          </h2>
          <p className="text-body max-w-2xl mx-auto">{t('description')}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-10">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-500" /> {t('aiProcessing')}
          </span>
          <span className="text-slate-300/60 dark:text-slate-600">•</span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> {t('highResReady')}
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENARIO_CONFIGS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <article
                key={scenario.id}
                className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
              >
                <div className="p-6 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {t(`scenarios.${scenario.id}.title`)}
                      </h3>
                      <p className="text-sm text-body">
                        {t(`scenarios.${scenario.id}.description`)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t(`scenarios.${scenario.id}.input1Label`)}
                      </span>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-inner">
                        <Image
                          src={scenario.input1.image}
                          alt={t(`scenarios.${scenario.id}.input1Label`)}
                          fill
                          sizes="(max-width: 768px) 45vw, 200px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t(`scenarios.${scenario.id}.input2Label`)}
                      </span>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-inner">
                        <Image
                          src={scenario.input2.image}
                          alt={t(`scenarios.${scenario.id}.input2Label`)}
                          fill
                          sizes="(max-width: 768px) 45vw, 200px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('generatedResult')}
                    </span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-lg">
                      <Image
                        src={scenario.result}
                        alt={t(`scenarios.${scenario.id}.title`)}
                        fill
                        sizes="(max-width: 768px) 90vw, 360px"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/5 pt-4">
                    <span>{t('supportedFormats')}</span>
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" /> {t('highResReady')}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
