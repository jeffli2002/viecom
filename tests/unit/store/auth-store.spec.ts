import { authClient } from '@/lib/auth/auth-client';
import { useAuthStore } from '@/store/auth-store';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
      social: jest.fn(),
    },
    signUp: {
      email: jest.fn(),
    },
    signOut: jest.fn(),
    getSession: jest.fn(),
    updateUser: jest.fn(),
  },
}));

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastUpdated: 0,
      isLoading: false,
      error: null,
      isInitialized: false,
    });

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { signupCreditsGranted: 0 } }),
      text: async () => '',
    })) as unknown as typeof fetch;
  });

  it('allows email/password sign-in for unverified users', async () => {
    (authClient.signIn.email as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

    const result = await useAuthStore.getState().signIn('test@example.com', 'password');

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(authClient.signOut).not.toHaveBeenCalled();
  });

  it('authenticates newly signed-up unverified users', async () => {
    (authClient.signUp.email as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'new@example.com',
          name: 'New User',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

    const result = await useAuthStore.getState().signUp('new@example.com', 'password', 'New User');

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/credits/initialize',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
