import { FileSpreadsheet, Layers, Target } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function BatchGenerationFeature() {
  const t = await getTranslations('batchGenerationFeature');

  return (
    <section className="section-base bg-alt">
      <div className="container-base">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="tag-pill bg-blue-500/10 text-blue-500 dark:text-blue-400 mb-6">
              <Layers className="w-4 h-4" /> {t('badge')}
            </div>
            <h2 className="h2-section">
              {t('title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">
                {t('titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-body leading-relaxed mb-8">{t('description')}</p>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="p-3 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-500 dark:text-teal-400">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('feature1Title')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('feature1Desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('feature2Title')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('feature2Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {[
                { image: '/batch/shoes.jpg', ratio: '1:1' },
                { image: '/batch/skincare.jpg', ratio: '9:16' },
                { image: '/batch/sweater.png', ratio: '16:9' },
                { image: '/batch/lotionmodel.png', ratio: '4:5' },
              ].map((item, index) => (
                <div
                  key={item.image}
                  className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transform transition-transform hover:scale-105"
                >
                  <div className="h-2/3 bg-slate-100 dark:bg-slate-800 relative overflow-hidden group">
                    <Image
                      src={item.image}
                      alt="Batch item preview"
                      fill
                      sizes="(max-width: 768px) 45vw, 200px"
                      priority={index === 0}
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white font-bold">
                      {item.ratio}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-teal-500/20 to-blue-500/20 blur-3xl rounded-full -z-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
