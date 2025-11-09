// Simple toast messages hook - can be enhanced with a toast library later
export function useToastMessages() {
  return {
    success: {
      loginSuccess: () => {
        // Can be implemented with a toast library
        console.log('Login successful');
      },
    },
    error: {
      loginFailed: (error?: string) => {
        console.error('Login failed:', error);
      },
      socialLoginFailed: () => {
        console.error('Social login failed');
      },
    },
  };
}


