let toastPromise: Promise<typeof import('sonner').toast> | null = null;

/**
 * Dynamically loads the Sonner toast API on the client.
 * This avoids importing `sonner` during SSR where it relies on `document`.
 */
export async function getToast(): Promise<typeof import('sonner').toast | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!toastPromise) {
    toastPromise = import('sonner').then((mod) => mod.toast);
  }

  return toastPromise;
}
