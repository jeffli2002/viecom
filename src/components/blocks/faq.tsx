'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          {faqItems.map((item, index) => (
            <div
              key={`faq-${index}-${item.question}`}
              className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white dark:bg-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-900/50 hover:border-teal-500/30'}`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-slate-900 dark:text-white pr-8">
                  {item.question}
                </span>
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${openIndex === index ? 'bg-teal-500 border-teal-500 text-white rotate-180' : 'border-slate-300 dark:border-slate-600 text-slate-500'}`}
                >
                  {openIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 text-body leading-relaxed text-sm md:text-base border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
