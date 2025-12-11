export { sendEmail } from './email-service';
export {
  getWelcomeEmailTemplate,
  getSubscriptionCreatedEmailTemplate,
  getSubscriptionUpgradedEmailTemplate,
  getSubscriptionDowngradedEmailTemplate,
  getSubscriptionCancelledEmailTemplate,
  getCreditPackPurchaseEmailTemplate,
} from './templates';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const { sendEmail } = await import('./email-service');
  const { getWelcomeEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Viecom! 🎉',
    html: getWelcomeEmailTemplate(userName, userEmail),
  });
}

/**
 * Send subscription created email
 */
export async function sendSubscriptionCreatedEmail(
  userEmail: string,
  userName: string,
  planName: string,
  planPrice: number,
  interval: 'month' | 'year',
  credits: number
) {
  const { sendEmail } = await import('./email-service');
  const { getSubscriptionCreatedEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: `Your ${planName} Subscription is Active! 🎉`,
    html: getSubscriptionCreatedEmailTemplate(userName, planName, planPrice, interval, credits),
  });
}

/**
 * Send subscription upgraded email
 */
export async function sendSubscriptionUpgradedEmail(
  userEmail: string,
  userName: string,
  oldPlanName: string,
  newPlanName: string,
  newPlanPrice: number,
  interval: 'month' | 'year',
  newCredits: number,
  effectiveDate: Date
) {
  const { sendEmail } = await import('./email-service');
  const { getSubscriptionUpgradedEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: `Subscription Upgraded to ${newPlanName}! ⬆️`,
    html: getSubscriptionUpgradedEmailTemplate(
      userName,
      oldPlanName,
      newPlanName,
      newPlanPrice,
      interval,
      newCredits,
      effectiveDate
    ),
  });
}

/**
 * Send subscription downgraded email
 */
export async function sendSubscriptionDowngradedEmail(
  userEmail: string,
  userName: string,
  oldPlanName: string,
  newPlanName: string,
  newPlanPrice: number,
  interval: 'month' | 'year',
  newCredits: number,
  effectiveDate: Date
) {
  const { sendEmail } = await import('./email-service');
  const { getSubscriptionDowngradedEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: `Subscription Changed to ${newPlanName}`,
    html: getSubscriptionDowngradedEmailTemplate(
      userName,
      oldPlanName,
      newPlanName,
      newPlanPrice,
      interval,
      newCredits,
      effectiveDate
    ),
  });
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail(
  userEmail: string,
  userName: string,
  planName: string,
  cancelDate: Date,
  accessUntilDate: Date
) {
  const { sendEmail } = await import('./email-service');
  const { getSubscriptionCancelledEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: `Your ${planName} Subscription Has Been Cancelled`,
    html: getSubscriptionCancelledEmailTemplate(userName, planName, cancelDate, accessUntilDate),
  });
}

/**
 * Send credit pack purchase email
 */
export async function sendCreditPackPurchaseEmail(
  userEmail: string,
  userName: string,
  packName: string,
  credits: number,
  price: number
) {
  const { sendEmail } = await import('./email-service');
  const { getCreditPackPurchaseEmailTemplate } = await import('./templates');

  return sendEmail({
    to: userEmail,
    subject: `Credits Purchased - ${credits.toLocaleString()} Credits Added! 🎉`,
    html: getCreditPackPurchaseEmailTemplate(userName, packName, credits, price),
  });
}
