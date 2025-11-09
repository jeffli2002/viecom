import { env } from '@/env';
import { db } from '@/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, apiKey } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      try {
        if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: env.RESEND_FROM_EMAIL,
              to: user.email,
              subject: 'Reset your password',
              html: `
                <p>Hello ${user.name || ''},</p>
                <p>You recently requested to reset your password.</p>
                <p><a href="${url}">Click here to create a new password</a>. This link will expire in 1 hour.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
              `,
            }),
          });

          if (!response.ok) {
            const detail = await response.text();
            console.error('Failed to send reset password email', {
              email: user.email,
              response: detail,
            });
          }
        } else {
          console.log(`[auth] Password reset link for ${user.email}: ${url}`);
        }
      } catch (error) {
        console.error('Error sending reset password email', error);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      scopes: ['openid', 'email', 'profile'],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 3,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
  },
  plugins: [admin(), apiKey()],
});
