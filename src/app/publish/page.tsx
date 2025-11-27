import Link from 'next/link';

type PublishPageProps = {
  searchParams?: { asset?: string };
};

export const metadata = {
  title: 'Publish on Viecom',
  description:
    'Preview your generated asset and follow the instructions to publish it on Viecom or your preferred marketplace.',
};

export default function PublishPage({ searchParams }: PublishPageProps) {
  const assetParam = searchParams?.asset;
  const assetUrl = assetParam ? decodeURIComponent(assetParam) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-500">
              Viecom Publish Flow
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Publish Your Creation</h1>
            <p className="text-base text-slate-600">
              Follow the steps below to publish your AI generated image or video on Viecom. Once
              you&apos;re done, return to the generator tab and confirm to receive your reward
              credits.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Steps to Publish</h2>
            <ol className="mt-4 space-y-4 text-slate-600">
              <li>
                <strong className="text-slate-900">1.</strong> Save the asset to your device using
                the download button below.
              </li>
              <li>
                <strong className="text-slate-900">2.</strong> Upload it to your Viecom store or
                preferred channel (Amazon, TikTok Shop, Etsy, etc.).
              </li>
              <li>
                <strong className="text-slate-900">3.</strong> Publish the listing or post.
              </li>
              <li>
                <strong className="text-slate-900">4.</strong> Return to the generator tab and click
                “Confirm publish” to unlock your reward credits.
              </li>
            </ol>
            <p className="mt-6 text-sm text-slate-500">
              After submission, the Viecom team will audit your asset before it reaches the public
              showcase. Need help?{' '}
              <Link href="mailto:support@viecom.pro" className="text-teal-500 hover:underline">
                Contact support
              </Link>
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Asset Preview</h2>
            {assetUrl ? (
              <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="overflow-hidden rounded-2xl bg-white">
                  <img
                    src={assetUrl}
                    alt="Generated asset"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                  >
                    Open in new tab
                  </a>
                  <a
                    href={assetUrl}
                    download
                    className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Download
                  </a>
                </div>
                <p className="text-xs text-slate-500 break-all">{assetUrl}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No asset URL detected. Return to the generator and click “Publish on Viecom” to
                re-open this page with your latest creation.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
