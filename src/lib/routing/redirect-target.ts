import { routing } from '@/i18n/routing';

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

const ensureAbsolutePath = (value: string) => {
  if (!value || value === '/') {
    return '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const splitPathAndSuffix = (path: string) => {
  const match = path.match(/^[^?#]*/);
  const pathname = match?.[0] ?? path;
  const suffix = path.slice(pathname.length);
  return {
    pathname: pathname || '/',
    suffix,
  };
};

const findLocalePrefix = (pathname: string) =>
  routing.locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

export interface RedirectTarget {
  localized: string;
  relative: string;
}

export function resolveRedirectTarget(locale: string, raw?: string | null): RedirectTarget {
  const normalized = raw?.trim();

  if (!normalized || normalized === '') {
    return {
      localized: `/${locale}`,
      relative: '/',
    };
  }

  if (EXTERNAL_URL_PATTERN.test(normalized)) {
    return {
      localized: normalized,
      relative: normalized,
    };
  }

  const absolutePath = ensureAbsolutePath(normalized);
  const { pathname, suffix } = splitPathAndSuffix(absolutePath);
  const matchedLocale = findLocalePrefix(pathname);

  let localizedPathname: string;
  if (matchedLocale) {
    localizedPathname = pathname;
  } else if (pathname === '/') {
    localizedPathname = `/${locale}`;
  } else {
    localizedPathname = `/${locale}${pathname}`;
  }

  let relativePathname: string;
  if (matchedLocale) {
    const prefix = `/${matchedLocale}`;
    const stripped = pathname.slice(prefix.length);
    relativePathname = stripped.length > 0 ? stripped : '/';
  } else {
    relativePathname = pathname;
  }

  if (!relativePathname.startsWith('/')) {
    relativePathname = `/${relativePathname}`;
  }

  return {
    localized: `${localizedPathname}${suffix}`,
    relative: `${relativePathname}${suffix}`,
  };
}
