'use client';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useTranslations } from 'next-intl';

export function HeaderAuthControls() {
  const t = useTranslations('nav');
  const { isAuthenticated, signOut } = useAuthStore();

  if (isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
      >
        {t('logout')}
      </button>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
      >
        {t('login')}
      </Link>
      <Link
        href="/signup"
        className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition-colors"
        aria-label={t('getStarted')}
      >
        {t('getStarted')}
      </Link>
    </>
  );
}
