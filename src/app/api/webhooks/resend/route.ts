import crypto from 'crypto';
import { env } from '@/env';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Resend Webhook Handler for receiving emails
 *
 * This endpoint receives email events from Resend when emails are sent to
 * addresses on your verified domain (e.g., support@viecom.pro)
 *
 * Webhook URL: https://yourdomain.com/api/webhooks/resend
 * Event type: email.received
 */

interface ResendEmailReceivedEvent {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc: string[];
    cc: string[];
    message_id: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }>;
  };
}

/**
 * Verify Resend webhook signature
 * See: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    console.error('[Resend Webhook] Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('[Resend Webhook] Incoming request', {
      requestId,
      method: request.method,
      url: request.url,
      headers: {
        'content-type': request.headers.get('content-type'),
        'resend-signature': request.headers.get('resend-signature') ? 'present' : 'missing',
        'user-agent': request.headers.get('user-agent'),
      },
    });

    const body = await request.text();
    const signature = request.headers.get('resend-signature');

    console.log('[Resend Webhook] Request body length:', body.length, { requestId });

    // Verify webhook signature if RESEND_WEBHOOK_SECRET is set
    if (env.RESEND_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(body, signature, env.RESEND_WEBHOOK_SECRET);

      if (!isValid) {
        console.error('[Resend Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (env.RESEND_WEBHOOK_SECRET && !signature) {
      console.warn('[Resend Webhook] Missing signature header');
      // In production, you might want to reject requests without signatures
      // For now, we'll log a warning but continue processing
    }

    const event: ResendEmailReceivedEvent = JSON.parse(body);

    // Only process email.received events
    if (event.type !== 'email.received') {
      console.log('[Resend Webhook] Ignoring event type:', event.type);
      return NextResponse.json({ received: true });
    }

    const { data } = event;

    console.log('[Resend Webhook] Email received', {
      requestId,
      email_id: data.email_id,
      from: data.from,
      to: data.to,
      subject: data.subject,
      has_attachments: (data.attachments?.length || 0) > 0,
      created_at: data.created_at,
    });

    // Forward email to configured forwarding address
    if (!env.RESEND_API_KEY) {
      console.error('[Resend Webhook] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    if (!env.RESEND_FORWARD_TO_EMAIL) {
      console.error('[Resend Webhook] RESEND_FORWARD_TO_EMAIL not configured');
      return NextResponse.json(
        { error: 'RESEND_FORWARD_TO_EMAIL not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(env.RESEND_API_KEY);

    try {
      // Retrieve the full email content (webhook doesn't include body)
      // Using direct API call as Resend SDK v4 may have different structure
      const emailResponse = await fetch(
        `https://api.resend.com/emails/receiving/${data.email_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let email: { html?: string; text?: string } = {};

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        email = emailData.data || emailData;
      } else {
        // If we can't retrieve email content (e.g., test email_id or API error),
        // use basic info from webhook event
        console.warn('[Resend Webhook] Could not retrieve email content, using webhook data', {
          email_id: data.email_id,
          status: emailResponse.status,
        });
        // Use empty content - we'll create a basic forward message
        email = {
          html: data.html,
          text: data.text,
        };
      }

      // Retrieve attachments if any
      const attachments: Array<{
        filename: string;
        content: string;
        content_type?: string;
      }> = [];

      if (data.attachments && data.attachments.length > 0) {
        try {
          const attachmentsResponse = await fetch(
            `https://api.resend.com/attachments/receiving?emailId=${data.email_id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (attachmentsResponse.ok) {
            const attachmentsData = await attachmentsResponse.json();
            const attachmentList = attachmentsData.data?.data || attachmentsData.data || [];

            // Download and encode attachments in base64
            for (const attachment of attachmentList) {
              try {
                const downloadResponse = await fetch(attachment.download_url);
                const buffer = Buffer.from(await downloadResponse.arrayBuffer());
                attachments.push({
                  filename: attachment.filename,
                  content: buffer.toString('base64'),
                  content_type: attachment.content_type,
                });
              } catch (attachmentError) {
                console.error('[Resend Webhook] Failed to download attachment', {
                  attachment_id: attachment.id,
                  error: attachmentError,
                });
              }
            }
          }
        } catch (attachmentsError) {
          console.error('[Resend Webhook] Failed to retrieve attachments', attachmentsError);
          // Continue forwarding even if attachments fail
        }
      }

      // Forward the email
      const forwardSubject = `[Forwarded] ${data.subject}`;
      const forwardFrom = env.RESEND_FROM_EMAIL || 'noreply@viecom.pro';
      const forwardTo = env.RESEND_FORWARD_TO_EMAIL;

      // Create forwarded email body
      const emailContent =
        email.html || email.text?.replace(/\n/g, '<br>') || 'Email content not available';
      const emailTextContent =
        email.text || email.html?.replace(/<[^>]*>/g, '') || 'Email content not available';

      const forwardedHtml = `
        <div style="border-left: 3px solid #14b8a6; padding-left: 15px; margin-bottom: 20px;">
          <p><strong>Forwarded from:</strong> ${data.from}</p>
          <p><strong>Original recipient:</strong> ${data.to.join(', ')}</p>
          <p><strong>Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        ${emailContent}
      `;

      const forwardedText = `
Forwarded from: ${data.from}
Original recipient: ${data.to.join(', ')}
Date: ${new Date(data.created_at).toLocaleString()}
Subject: ${data.subject}

---

${emailTextContent}
      `;

      const forwardResult = await resend.emails.send({
        from: forwardFrom,
        to: forwardTo,
        subject: forwardSubject,
        html: forwardedHtml,
        text: forwardedText,
        attachments: attachments.length > 0 ? attachments : undefined,
        reply_to: data.from, // Set reply-to to original sender
      });

      console.log('[Resend Webhook] Email forwarded successfully', {
        requestId,
        email_id: data.email_id,
        forwarded_to: forwardTo,
        forward_email_id: forwardResult.data?.id,
        forward_from: forwardFrom,
      });

      return NextResponse.json({
        received: true,
        forwarded: true,
        forward_email_id: forwardResult.data?.id,
      });
    } catch (forwardError) {
      console.error('[Resend Webhook] Failed to forward email', {
        email_id: data.email_id,
        error: forwardError,
      });

      // Still return success to Resend to avoid retries
      // You might want to implement retry logic or error notification here
      return NextResponse.json({
        received: true,
        forwarded: false,
        error: forwardError instanceof Error ? forwardError.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET() {
  return NextResponse.json({
    message: 'Resend webhook endpoint is active',
    endpoint: '/api/webhooks/resend',
    event_type: 'email.received',
  });
}
