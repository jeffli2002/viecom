import { randomUUID } from 'node:crypto';
import { paymentConfig } from '@/config/payment.config';
import { env } from '@/env';
import { creditService } from '@/lib/credits';
import { sendEmailVerificationEmail, sendWelcomeEmail } from '@/lib/email';
import { db } from '@/server/db';
import { creditTransactions, verification } from '@/server/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, apiKey } from 'better-auth/plugins';
import { desc, eq } from 'drizzle-orm';

const createTrustedOrigins = (): string[] => {
  const origins = new Set<string>();

  try {
    const baseUrl = new URL(env.NEXT_PUBLIC_APP_URL);
    const baseOrigin = `${baseUrl.protocol}//${baseUrl.host}`;
    origins.add(baseOrigin);

    const hostname = baseUrl.hostname.toLowerCase();
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost');

    // Trust Vercel preview deployments
    const isVercelPreview = hostname.endsWith('.vercel.app');

    if (!isLocalhost && !isVercelPreview) {
      const portSuffix = baseUrl.port ? `:${baseUrl.port}` : '';

      if (hostname.startsWith('www.')) {
        const rootHost = hostname.replace(/^www\./, '');
        origins.add(`${baseUrl.protocol}//${rootHost}${portSuffix}`);
      } else {
        origins.add(`${baseUrl.protocol}//www.${hostname}${portSuffix}`);
      }
    }

    // For Vercel previews, explicitly trust the exact URL
    if (isVercelPreview) {
      origins.add(baseOrigin);
    }
  } catch (error) {
    console.warn('[auth] Invalid NEXT_PUBLIC_APP_URL, cannot derive trusted origins:', error);
  }

  return Array.from(origins);
};

const EMAIL_VERIFICATION_EXPIRES_IN = 60 * 60 * 24;
const EMAIL_VERIFICATION_COOLDOWN_MS = 2 * 60 * 1000;

const grantSignupCreditsAndWelcomeEmail = async (user: {
  id: string;
  email: string;
  name?: string | null;
}) => {
  const freePlan = paymentConfig.plans.find((plan) => plan.id === 'free');
  const signupCredits = freePlan?.credits?.onSignup ?? 0;

  if (!signupCredits || signupCredits <= 0) {
    return;
  }

  const signupReferenceId = `signup_${user.id}`;

  const [existingSignupTx] = await db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(eq(creditTransactions.referenceId, signupReferenceId))
    .limit(1);

  if (existingSignupTx) {
    return;
  }

  await creditService.getOrCreateCreditAccount(user.id);

  await creditService.earnCredits({
    userId: user.id,
    amount: signupCredits,
    source: 'bonus',
    description: 'Welcome bonus - thank you for signing up!',
    referenceId: signupReferenceId,
  });

  console.log(`[auth] Granted signup credits to ${user.email}`);

  try {
    const sent = await sendWelcomeEmail(user.email, user.name || 'User');
    if (sent) {
      console.log(`[auth] Welcome email sent to ${user.email}`);
    } else {
      console.warn(`[auth] Welcome email skipped for ${user.email}`);
    }
  } catch (emailError) {
    console.error(`[auth] Failed to send welcome email to ${user.email}:`, emailError);
  }
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: createTrustedOrigins(),
  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          try {
            if (newUser.emailVerified) {
              await grantSignupCreditsAndWelcomeEmail(newUser);
            }
          } catch (error) {
            console.error(
              `[auth] Failed to process signup flow for ${newUser?.email ?? 'unknown user'}:`,
              error
            );
          }
        },
      },
    },
  },
  emailVerification: {
    expiresIn: EMAIL_VERIFICATION_EXPIRES_IN,
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Normalize verification URL host to match NEXT_PUBLIC_APP_URL (prevents apex/www cookie mismatches)
      let normalizedUrl = url;
      try {
        const app = new URL(env.NEXT_PUBLIC_APP_URL);
        const u = new URL(url);
        if (u.host !== app.host) {
          u.host = app.host;
          u.protocol = app.protocol;
          normalizedUrl = u.toString();
        }
      } catch {
        // leave original url if parsing fails
      }
      const identifier = `email-verification:${user.email.toLowerCase()}`;
      const [recentEntry] = await db
        .select({ createdAt: verification.createdAt })
        .from(verification)
        .where(eq(verification.identifier, identifier))
        .orderBy(desc(verification.createdAt))
        .limit(1);

      if (recentEntry) {
        const elapsedMs = Date.now() - new Date(recentEntry.createdAt).getTime();
        if (elapsedMs < EMAIL_VERIFICATION_COOLDOWN_MS) {
          console.warn(`[auth] Verification email throttled for ${user.email}`);
          return;
        }
      }

      const sent = await sendEmailVerificationEmail(user.email, user.name || 'User', normalizedUrl);

      if (sent) {
        console.log(`[auth] Verification email sent to ${user.email}`);
        try {
          await db.insert(verification).values({
            id: randomUUID(),
            identifier,
            value: 'email-verification',
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_COOLDOWN_MS),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (insertError) {
          console.warn('[auth] Failed to store verification throttle record:', insertError);
        }
      } else {
        console.warn(`[auth] Verification email skipped for ${user.email}`);
      }
    },
    afterEmailVerification: async (verifiedUser) => {
      try {
        await grantSignupCreditsAndWelcomeEmail(verifiedUser);
      } catch (error) {
        console.error(
          `[auth] Failed to process signup credits after verification for ${verifiedUser?.email ?? 'unknown user'}:`,
          error
        );
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    // Require verification before allowing email+password sign-in
    requireEmailVerification: true,
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
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-vercel-forwarded-for', 'x-real-ip'],
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60 * 60,
    max: 100,
    customRules: {
      '/sign-up/email': {
        window: 60 * 60,
        max: 3,
      },
    },
  },
  plugins: [admin(), apiKey()],
});
