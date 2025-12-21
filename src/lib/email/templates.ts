import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';

const APP_NAME = 'Viecom';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.viecom.pro';
const SUPPORT_EMAIL = 'support@viecom.pro';

/**
 * Base email template wrapper
 */
function baseTemplate(content: string, footerText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background-color: #ffffff;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 20px 0; text-align: center; border-bottom: 2px solid #14b8a6;">
              <h1 style="margin: 0; color: #14b8a6; font-size: 28px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 20px; color: #333333; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              ${
                footerText ||
                `
                <p style="margin: 0 0 10px 0;">
                  Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #14b8a6; text-decoration: none;">${SUPPORT_EMAIL}</a>
                </p>
                <p style="margin: 0;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
              `
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Welcome email template for new user signup
 */
export function getWelcomeEmailTemplate(userName: string, _userEmail: string): string {
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const signupCredits = freePlan?.credits.onSignup || 15;

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Welcome to ${APP_NAME}! 🎉</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Thank you for joining ${APP_NAME}! We're excited to have you on board.
    </p>
    
    <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #065f46; font-weight: 600;">
        🎁 Your Welcome Bonus
      </p>
      <p style="margin: 0; color: #047857; font-size: 18px; font-weight: 600;">
        ${signupCredits} Free Credits
      </p>
      <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
        Start generating amazing AI images and videos right away!
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      If you have any questions, feel free to reach out to our support team at 
      <a href="mailto:${SUPPORT_EMAIL}" style="color: #14b8a6; text-decoration: none;">${SUPPORT_EMAIL}</a>.
    </p>
  `;

  return baseTemplate(content);
}

/**
 * Email verification template for new user signup
 */
export function getEmailVerificationTemplate(userName: string, verificationUrl: string): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Confirm your email address</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Please confirm your email address to activate your ${APP_NAME} account and receive your signup bonus.
    </p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Confirm Email
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      If you did not create an account, you can safely ignore this email.
    </p>
  `;

  return baseTemplate(content);
}

/**
 * Subscription created email template
 */
export function getSubscriptionCreatedEmailTemplate(
  userName: string,
  planName: string,
  planPrice: number,
  interval: 'month' | 'year',
  credits: number
): string {
  const billingPeriod = interval === 'year' ? 'year' : 'month';
  const displayPrice = interval === 'year' ? (planPrice / 12).toFixed(2) : planPrice.toFixed(2);
  const yearlyPrice = interval === 'year' ? planPrice : planPrice * 12;

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Subscription Activated! 🎉</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Your ${planName} subscription has been successfully activated!
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Billing:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">
            $${displayPrice}/${billingPeriod === 'year' ? 'mo' : 'month'}
            ${interval === 'year' ? ` (billed annually: $${yearlyPrice.toFixed(2)})` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Credits:</td>
          <td style="padding: 8px 0; text-align: right; color: #14b8a6; font-weight: 600;">${credits.toLocaleString()} credits/${billingPeriod}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✅ Your credits have been added to your account. Start creating amazing content now!
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      Need to manage your subscription? Visit your 
      <a href="${APP_URL}/billing" style="color: #14b8a6; text-decoration: none;">billing settings</a>.
    </p>
  `;

  return baseTemplate(content);
}

/**
 * Subscription upgraded email template
 */
export function getSubscriptionUpgradedEmailTemplate(
  userName: string,
  oldPlanName: string,
  newPlanName: string,
  newPlanPrice: number,
  interval: 'month' | 'year',
  newCredits: number,
  effectiveDate: Date
): string {
  const billingPeriod = interval === 'year' ? 'year' : 'month';
  const displayPrice =
    interval === 'year' ? (newPlanPrice / 12).toFixed(2) : newPlanPrice.toFixed(2);

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Subscription Upgraded! ⬆️</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Your subscription has been upgraded from <strong>${oldPlanName}</strong> to <strong>${newPlanName}</strong>.
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${newPlanName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Price:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">$${displayPrice}/${billingPeriod === 'year' ? 'mo' : 'month'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Credits:</td>
          <td style="padding: 8px 0; text-align: right; color: #14b8a6; font-weight: 600;">${newCredits.toLocaleString()} credits/${billingPeriod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Effective Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827;">${effectiveDate.toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ Your upgrade will take effect at the start of your next billing period. You'll continue to have access to ${oldPlanName} features until then.
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Subscription downgraded email template
 */
export function getSubscriptionDowngradedEmailTemplate(
  userName: string,
  oldPlanName: string,
  newPlanName: string,
  newPlanPrice: number,
  interval: 'month' | 'year',
  newCredits: number,
  effectiveDate: Date
): string {
  const billingPeriod = interval === 'year' ? 'year' : 'month';
  const displayPrice =
    interval === 'year' ? (newPlanPrice / 12).toFixed(2) : newPlanPrice.toFixed(2);

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Subscription Changed ⬇️</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Your subscription has been changed from <strong>${oldPlanName}</strong> to <strong>${newPlanName}</strong>.
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${newPlanName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Price:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">$${displayPrice}/${billingPeriod === 'year' ? 'mo' : 'month'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">New Credits:</td>
          <td style="padding: 8px 0; text-align: right; color: #14b8a6; font-weight: 600;">${newCredits.toLocaleString()} credits/${billingPeriod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Effective Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827;">${effectiveDate.toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ Your plan change will take effect at the start of your next billing period. You'll continue to have access to ${oldPlanName} features until then.
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/billing" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Manage Subscription
      </a>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Subscription cancelled email template
 */
export function getSubscriptionCancelledEmailTemplate(
  userName: string,
  planName: string,
  cancelDate: Date,
  accessUntilDate: Date
): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Subscription Cancelled</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Your ${planName} subscription has been cancelled as requested.
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Cancelled On:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827;">${cancelDate.toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Access Until:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${accessUntilDate.toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ℹ️ You'll continue to have access to ${planName} features until ${accessUntilDate.toLocaleDateString()}. After that, your account will be moved to the Free plan.
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/billing" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Reactivate Subscription
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime before ${accessUntilDate.toLocaleDateString()}.
    </p>
  `;

  return baseTemplate(content);
}

/**
 * Credit pack purchase email template
 */
export function getCreditPackPurchaseEmailTemplate(
  userName: string,
  packName: string,
  credits: number,
  price: number
): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Credits Purchased! 🎉</h2>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #374151;">
      Thank you for your purchase! Your credits have been added to your account.
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Credit Pack:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${packName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Credits Added:</td>
          <td style="padding: 8px 0; text-align: right; color: #14b8a6; font-weight: 600; font-size: 20px;">${credits.toLocaleString()} credits</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">$${price.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✅ Your credits never expire! Use them anytime to generate amazing AI images and videos.
      </p>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Start Creating
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      Need more credits? Visit our <a href="${APP_URL}/pricing" style="color: #14b8a6; text-decoration: none;">pricing page</a> to purchase additional credit packs.
    </p>
  `;

  return baseTemplate(content);
}
