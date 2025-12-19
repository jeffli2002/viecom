import { getTranslations } from 'next-intl/server';

export async function FAQ() {
  const t = await getTranslations('faq');

  const faqItems = [
    { question: t('q1.question'), answer: t('q1.answer') },
    { question: t('q2.question'), answer: t('q2.answer') },
    { question: t('q3.question'), answer: t('q3.answer') },
    { question: t('q4.question'), answer: t('q4.answer') },
    { question: t('q5.question'), answer: t('q5.answer') },
    { question: t('q6.question'), answer: t('q6.answer') },
    { question: t('q7.question'), answer: t('q7.answer') },
    { question: t('q8.question'), answer: t('q8.answer') },
    { question: t('q9.question'), answer: t('q9.answer') },
  ];

  return (
    <section className="section-base bg-alt">
      <div className="container-base max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="h2-section">
            {t('title')} <span className="text-teal-500">{t('titleHighlight')}</span>
          </h2>
          <p className="text-lg text-body">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm"
            >
              <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between text-left focus:outline-none">
                <span className="font-bold text-slate-900 dark:text-white pr-8">
                  {item.question}
                </span>
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-600 text-slate-500 transition-all duration-300 group-open:rotate-180 group-open:bg-teal-500 group-open:border-teal-500 group-open:text-white">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>

              <div className="px-6 pb-6 text-body leading-relaxed text-sm md:text-base border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
