#!/usr/bin/env tsx
/**
 * Send support email reply as support@viecom.pro
 * Usage: pnpm tsx scripts/send-support-email.ts <to-email> <subject> <message>
 * Example: pnpm tsx scripts/send-support-email.ts user@example.com "Re: Your issue" "Thank you for contacting us..."
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function sendSupportEmail() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('');
    console.log('Usage: pnpm tsx scripts/send-support-email.ts <to-email> <subject> <message>');
    console.log('');
    console.log('Examples:');
    console.log('  pnpm tsx scripts/send-support-email.ts user@example.com "Re: Your issue" "Thank you for contacting us..."');
    console.log('  pnpm tsx scripts/send-support-email.ts promodkc@gmail.com "Update on your request" "Your video is ready!"');
    console.log('');
    process.exit(1);
  }

  const [toEmail, subject, message] = args;

  console.log('\n' + '='.repeat(80));
  console.log('📧 SENDING SUPPORT EMAIL');
  console.log('='.repeat(80) + '\n');
  console.log(`From: support@viecom.pro (via Resend)`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
  console.log('');

  try {
    const { sendEmail } = await import('../src/lib/email/email-service');
    
    // Create professional email HTML
    // Split message by newlines and create paragraphs
    const messageParagraphs = message
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
          <div style="margin-bottom: 20px;">
            <img src="https://www.viecom.pro/ViecomLogoV6.png" alt="Viecom" style="height: 40px;" />
          </div>
          
          ${messageParagraphs}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0;"><strong>Viecom Support Team</strong></p>
            <p style="margin: 0 0 5px 0;">Email: support@viecom.pro</p>
            <p style="margin: 0;">Website: <a href="https://www.viecom.pro" style="color: #14b8a6; text-decoration: none;">www.viecom.pro</a></p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© 2025 Viecom. All rights reserved.</p>
        </div>
      </div>
    `;

    const success = await sendEmail({
      to: toEmail,
      subject: subject,
      html: emailHtml,
    });

    if (success) {
      console.log('✅ Email sent successfully!\n');
      console.log('='.repeat(80));
      console.log('User will see:');
      console.log(`  From: ${process.env.RESEND_FROM_EMAIL || 'support@viecom.pro'}`);
      console.log(`  Subject: ${subject}`);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('❌ Failed to send email\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

sendSupportEmail();

