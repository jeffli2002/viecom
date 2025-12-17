import { BatchImageUpload } from '@/components/workflow/batch-image-upload';
import { getTranslations } from 'next-intl/server';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export default async function BatchImageGenerationPage() {
  const t = await getTranslations('batchGeneration');
  const faqItems = FAQ_KEYS.map((key) => ({
    key,
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const faqJson = JSON.stringify(faqSchema);

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('titleImage')}</h1>
        <p className="text-body">{t('subtitleImage')}</p>
      </div>
      <BatchImageUpload />

      <div className="max-w-3xl mx-auto mt-20 mb-12">
        <h2 className="h2-section text-center mb-12">{t('faq.title')}</h2>
        <div className="space-y-8">
          {faqItems.map((item) => (
            <div key={item.key}>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                {item.question}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <script type="application/ld+json" suppressHydrationWarning>
        {faqJson}
      </script>
    </div>
  );
}
