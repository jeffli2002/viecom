import { Check, Globe, Shield, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function BrandAnalysis() {
  const t = await getTranslations('brandAnalysis');
  return (
    <section className="section-base bg-alt">
      <div className="container-base">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-bold rounded-full border border-green-500/20">
                    {t('verified')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                      {t('colorPalette')}
                    </span>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#14b8a6] shadow-sm" />
                      <div className="w-8 h-8 rounded-full bg-[#0f172a] shadow-sm" />
                      <div className="w-8 h-8 rounded-full bg-[#f8fafc] border border-slate-200 shadow-sm" />
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                      {t('typography')}
                    </span>
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">Aa</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Space Grotesk</div>
                  </div>
                </div>

                <div className="mt-4 bg-teal-500/5 border border-teal-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-sm font-medium mb-1">
                    <Sparkles className="w-4 h-4" /> {t('brandVoiceDetected')}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t('brandVoiceExample')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="tag-pill bg-blue-500/10 text-blue-700 dark:text-blue-300 mb-6">
              <Shield className="w-4 h-4" /> {t('badge')}
            </div>
            <h2 className="h2-section">
              {t('titleLine1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">
                {t('titleLine2')}
              </span>
            </h2>
            <p className="text-lg text-body leading-relaxed mb-8">{t('description')}</p>
            <ul className="space-y-4">
              {[t('feature1'), t('feature2'), t('feature3')].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
