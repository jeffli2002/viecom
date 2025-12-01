import { env } from '@/env';
import { Resend } from 'resend';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend || !env.RESEND_FROM_EMAIL) {
    console.warn('[Email Service] Resend not configured, skipping email:', {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error('[Email Service] Failed to send email:', {
        to: options.to,
        subject: options.subject,
        error: result.error,
      });
      return false;
    }

    console.log('[Email Service] Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      emailId: result.data?.id,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

