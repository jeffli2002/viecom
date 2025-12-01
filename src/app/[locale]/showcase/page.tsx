import { SHOWCASE_CATEGORIES, getShowcaseCategoryLabel } from '@/config/showcase.config';
import { getApprovedShowcaseEntries } from '@/lib/publish/submissions';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';

type ShowcasePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'landing', '/showcase');
}

export default async function ShowcasePage({ params }: ShowcasePageProps) {
  void params;
  const entries = await getApprovedShowcaseEntries({ placement: 'showcase', limit: 200 });

  const grouped = SHOWCASE_CATEGORIES.map((category) => ({
    ...category,
    items: entries.filter((entry) => (entry.category || 'other') === category.id),
  }));

  const uncategorized = entries.filter(
    (entry) => !SHOWCASE_CATEGORIES.some((category) => category.id === (entry.category || ''))
  );

  if (uncategorized.length > 0) {
    grouped.push({
      id: 'misc',
      label: 'Community Highlights',
      items: uncategorized,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-500">
            Viecom Showcase
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Featured Creations from Our Community
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Handpicked assets approved by the Viecom team. Browse by category and draw inspiration
            for your next campaign.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          {grouped.map((group) => {
            if (!group.items || group.items.length === 0) {
              return null;
            }
            return (
              <section key={group.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">{group.label}</h2>
                  <span className="text-sm text-slate-500">
                    {group.items.length} submission{group.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-slate-100">
                        <img
                          src={item.previewUrl ?? item.assetUrl}
                          alt={item.title ?? 'Showcase asset'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="font-semibold">{item.title ?? 'Showcase Item'}</h3>
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                          {getShowcaseCategoryLabel(item.category)}
                        </p>
                        <a
                          href={item.assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sm font-semibold text-teal-500 hover:text-teal-600"
                        >
                          View asset
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          {grouped.every((group) => !group.items || group.items.length === 0) && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              No showcase entries yet. Approved submissions will appear here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
