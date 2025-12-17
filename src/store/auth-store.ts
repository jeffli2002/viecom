'use client';

import { authClient } from '@/lib/auth/auth-client';
import type { User } from 'better-auth/types';
import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';

// Helper function to initialize user credits with retry mechanism
const initializeUserCredits = async (userId: string, retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('/api/credits/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.signupCreditsGranted > 0) {
          console.log(`✅ Successfully initialized credits (attempt ${attempt})`);
          return;
        }
        console.log(
          `✅ Credits initialized (attempt ${attempt}), signup bonus: ${data.data?.signupCreditsGranted || 0}`
        );
        return;
      }

      const errorText = await response.text();
      console.warn(
        `⚠️ Failed to initialize user credits (attempt ${attempt}/${retries}):`,
        errorText
      );

      // If it's the last attempt, log the error but don't throw
      if (attempt === retries) {
        console.error(`❌ Failed to initialize user credits after ${retries} attempts`);
        // Don't throw - we'll retry in initialize() method as fallback
      } else {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.warn(`⚠️ Error initializing user credits (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) {
        console.error(`❌ Failed to initialize user credits after ${retries} attempts`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
};

// Ensure OAuth callback URLs retain a flag we can detect after redirect
const appendOAuthCallbackParam = (url?: string, provider = 'google') => {
  const target = url && url.trim().length > 0 ? url : '/';

  if (target.includes('authCallback=')) {
    return target;
  }

  const [pathWithQuery, hash] = target.split('#', 2);
  const separator = pathWithQuery.includes('?') ? '&' : '?';
  const updatedPath = `${pathWithQuery}${separator}authCallback=${provider}`;
  const withHash = hash ? `${updatedPath}#${hash}` : updatedPath;

  // Better Auth expects absolute callback URLs in some deployments
  if (typeof window !== 'undefined' && !withHash.startsWith('http')) {
    const absolute = new URL(withHash, window.location.origin);
    return absolute.toString();
  }

  return withHash;
};

const fetchSessionUser = async (): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/get-session', {
      credentials: 'include',
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const sessionUser = data?.session?.user ?? data?.user ?? null;
    if (sessionUser?.id) {
      return sessionUser;
    }
  } catch (error) {
    console.warn('[Auth] Failed to fetch session via REST endpoint:', error);
  }
  return null;
};

interface AuthState {
  // Persistent state
  user: User | null;
  isAuthenticated: boolean;
  lastUpdated: number;

  // Temporary state
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Cache configuration
  cacheExpiry: number;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;

  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  signInWithGoogle: (callbackUrl?: string) => Promise<void>;

  updateUser: (data: { name?: string; image?: string }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  initialize: (force?: boolean) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAuth: () => void;

  // Cache methods
  isCacheValid: () => boolean;
  invalidateCache: () => void;
  setCacheExpiry: (expiry: number) => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get): AuthState => ({
        // Persistent state
        user: null,
        isAuthenticated: false,
        lastUpdated: 0,

        // Temporary state
        isLoading: false,
        error: null,
        isInitialized: false,
        cacheExpiry: 10 * 60 * 1000, // 10 minutes

        // Cache methods
        isCacheValid: () => {
          const { lastUpdated, cacheExpiry } = get();
          return lastUpdated > 0 && Date.now() - lastUpdated < cacheExpiry;
        },

        invalidateCache: () => set({ lastUpdated: 0 }),

        setCacheExpiry: (expiry: number) => set({ cacheExpiry: expiry }),

        // Actions
        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
            lastUpdated: Date.now(),
          });
        },

        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        setInitialized: (initialized) => {
          set({ isInitialized: initialized });
        },

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },
        signIn: async (email, password) => {
          set({ isLoading: true, error: null });
          const previousUser = get().user;

          try {
            const result = await authClient.signIn.email({
              email,
              password,
            });

            if (result.data) {
              const user = result.data.user;

              // Check if user exists and has an id
              if (!user || !user.id) {
                set({ isLoading: false, error: 'Invalid user data' });
                return {
                  success: false,
                  error: 'Invalid user data',
                };
              }

              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                lastUpdated: Date.now(),
              });

              if (!previousUser || previousUser.id !== user.id) {
                await initializeUserCredits(user.id, 3);
              }

              return { success: true };
            }

            const message = result.error?.message || 'Invalid email or password';
            set({ isLoading: false, error: message });
            return {
              success: false,
              error: message,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'signIn error';
            set({ error: errorMessage, isLoading: false });
            return {
              success: false,
              error: errorMessage,
            };
          }
        },
        signUp: async (email, password, name) => {
          set({ isLoading: true, error: null });

          try {
            const result = await authClient.signUp.email({
              email: email,
              password,
              name: name || '',
            });

            if (result.data) {
              const user = result.data.user;

              // Check if user exists and has an id
              if (!user || !user.id) {
                set({ isLoading: false, error: 'Invalid user data' });
                return {
                  success: false,
                  error: 'Invalid user data',
                };
              }

              set({
                user,
                isAuthenticated: true,
                lastUpdated: Date.now(),
              });

              // Initialize user credits after successful registration and wait for completion
              try {
                await initializeUserCredits(user.id, 3);
              } catch (err) {
                console.error('Failed to initialize credits during signup:', err);
                // Allow signup to succeed even if credit initialization fails
              } finally {
                set({ isLoading: false });
              }

              return { success: true };
            }
            set({ isLoading: false });
            return {
              success: false,
              error: result.error?.message || 'signUp error',
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'signUp error';
            set({ error: errorMessage, isLoading: false });
            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        signOut: async () => {
          set({ isLoading: true });

          try {
            await authClient.signOut();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              lastUpdated: 0,
            });
          } catch (error) {
            console.error('Sign out error:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              lastUpdated: 0,
            });
          }
        },

        signInWithGoogle: async (callbackUrl?: string) => {
          set({ error: null });

          try {
            const callbackWithFlag = appendOAuthCallbackParam(callbackUrl, 'google');
            await authClient.signIn.social({
              provider: 'google',
              callbackURL: callbackWithFlag,
            });
          } catch (error) {
            console.error('Google sign in error:', error);
            set({ error: 'Failed to sign in with Google' });
          }
        },

        updateUser: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const result = await authClient.updateUser(data);

            if (result.data?.status) {
              await get().refreshSession();
              set({ isLoading: false });
              return { success: true };
            }

            set({ isLoading: false });
            return {
              success: false,
              error: result.error?.message || 'updateUser error',
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'updateUser error';
            set({ error: errorMessage, isLoading: false });
            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        refreshSession: async () => {
          const previousUser = get().user;

          try {
            const session = await authClient.getSession();
            let user = session.data?.user;

            if (!user || !user.id) {
              user = await fetchSessionUser();
            }

            if (user?.id) {
              set({
                user,
                isAuthenticated: true,
                lastUpdated: Date.now(),
              });

              if (!previousUser || previousUser.id !== user.id) {
                await initializeUserCredits(user.id, 3);
              }
            } else {
              set({
                user: null,
                isAuthenticated: false,
                lastUpdated: Date.now(),
              });
            }
          } catch (error) {
            console.error('Refresh session error:', error);
            set({
              user: null,
              isAuthenticated: false,
              lastUpdated: Date.now(),
            });
          }
        },

        initialize: async (force = false) => {
          if (get().isInitialized && !force) return;

          set({ isLoading: true });
          const previousUser = get().user;

          // Check if auth is disabled via environment variable
          if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
            const mockUser: User = {
              id: 'dev-user',
              email: 'dev@example.com',
              name: 'Dev User',
              emailVerified: true,
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            set({
              user: mockUser,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              lastUpdated: Date.now(),
            });
            return;
          }

          try {
            const session = await authClient.getSession();
            let user = session.data?.user;

            if (!user || !user.id) {
              user = await fetchSessionUser();
            }

            if (user?.id) {
              const isNewUser = !previousUser || previousUser.id !== user.id;

              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                lastUpdated: Date.now(),
              });

              if (isNewUser) {
                await initializeUserCredits(user.id, 3);
              } else {
                try {
                  const checkResponse = await fetch('/api/credits/check', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.id }),
                    credentials: 'include',
                  });

                  if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    if (!checkData.hasAccount) {
                      console.log(`⚠️ User ${user.email} has no credit account, initializing...`);
                      await initializeUserCredits(user.id, 3);
                    }
                  }
                } catch (checkError) {
                  console.warn('Failed to check credit account:', checkError);
                }
              }
            } else {
              if (!get().isCacheValid()) {
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  isInitialized: true,
                  lastUpdated: Date.now(),
                });
              } else {
                set({
                  isLoading: false,
                  isInitialized: true,
                });
              }
            }
          } catch (error) {
            console.error('Initialize error:', error);
            // If it's a network error, retry once after a short delay
            if (error instanceof TypeError && error.message.includes('fetch')) {
              console.log('[Auth] Network error detected, retrying in 1 second...');
              setTimeout(async () => {
                try {
                  const retrySession = await authClient.getSession();
                  if (retrySession.data) {
                    const user = retrySession.data.user;

                    // Check if user exists and has an id
                    if (!user || !user.id) {
                      if (!get().isCacheValid()) {
                        set({
                          user: null,
                          isAuthenticated: false,
                          isLoading: false,
                          isInitialized: true,
                          lastUpdated: Date.now(),
                        });
                      } else {
                        set({
                          isLoading: false,
                          isInitialized: true,
                        });
                      }
                      return;
                    }

                    set({
                      user,
                      isAuthenticated: true,
                      isLoading: false,
                      isInitialized: true,
                      lastUpdated: Date.now(),
                    });
                    return;
                  }
                } catch (retryError) {
                  console.error('[Auth] Retry failed:', retryError);
                }
                // If retry also fails, fall through to normal error handling
                if (!get().isCacheValid()) {
                  set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isInitialized: true,
                    lastUpdated: Date.now(),
                  });
                } else {
                  set({
                    isLoading: false,
                    isInitialized: true,
                  });
                }
              }, 1000);
              return;
            }
            // Normal error handling for non-network errors
            if (!get().isCacheValid()) {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
                lastUpdated: Date.now(),
              });
            } else {
              set({
                isLoading: false,
                isInitialized: true,
              });
            }
          }
        },
        clearAuth: () => {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            lastUpdated: 0,
          });
        },
      }),
      {
        name: 'ecommerce-ai-auth',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastUpdated: state.lastUpdated,
          cacheExpiry: state.cacheExpiry,
        }),
        skipHydration: false,
        version: 1,
      }
    )
  )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useInitialize = () => useAuthStore((state) => state.initialize);
export const useEmailLogin = () => useAuthStore((state) => state.signIn);
export const useClearError = () => useAuthStore((state) => state.clearError);
export const useSignInWithGoogle = () => useAuthStore((state) => state.signInWithGoogle);
export const useSignOut = () => useAuthStore((state) => state.signOut);
export const useRefreshSession = () => useAuthStore((state) => state.refreshSession);
export const useEmailSignup = () => useAuthStore((state) => state.signUp);
export const useSetError = () => useAuthStore((state) => state.setError);
export const useUpdateUser = () => useAuthStore((state) => state.updateUser);
