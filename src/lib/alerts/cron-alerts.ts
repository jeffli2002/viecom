/**
 * Alert system for cron job failures
 * Sends notifications to Slack/Discord when issues are detected
 */

import { env } from '@/env';

interface CronAlertData {
  jobName: string;
  executionId: string;
  status: 'failed' | 'high_error_rate' | 'many_stuck_tasks';
  duration?: number;
  error?: string;
  results?: {
    completed?: number;
    failed?: number;
    stillProcessing?: number;
    errors?: number;
    totalFound?: number;
  };
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(data: CronAlertData): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[Alerts] Slack webhook not configured, skipping alert');
    return;
  }

  const emoji = data.status === 'failed' ? '🔴' : '⚠️';
  const color = data.status === 'failed' ? '#ef4444' : '#f59e0b';

  const message = {
    text: `${emoji} Cron Job Alert: ${data.jobName}`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Status',
            value: data.status.replace('_', ' ').toUpperCase(),
            short: true,
          },
          {
            title: 'Execution ID',
            value: data.executionId,
            short: true,
          },
          ...(data.duration
            ? [
                {
                  title: 'Duration',
                  value: `${(data.duration / 1000).toFixed(1)}s`,
                  short: true,
                },
              ]
            : []),
          ...(data.error
            ? [
                {
                  title: 'Error',
                  value: data.error,
                  short: false,
                },
              ]
            : []),
          ...(data.results
            ? [
                {
                  title: 'Results',
                  value: `Completed: ${data.results.completed || 0}, Failed: ${data.results.failed || 0}, Errors: ${data.results.errors || 0}`,
                  short: false,
                },
              ]
            : []),
        ],
        footer: 'Viecom Cron Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log('[Alerts] Slack alert sent successfully');
  } catch (error) {
    console.error('[Alerts] Failed to send Slack alert:', error);
  }
}

/**
 * Send alert to Discord
 */
async function sendDiscordAlert(data: CronAlertData): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[Alerts] Discord webhook not configured, skipping alert');
    return;
  }

  const emoji = data.status === 'failed' ? '🔴' : '⚠️';
  const color = data.status === 'failed' ? 0xef4444 : 0xf59e0b;

  const embed = {
    title: `${emoji} Cron Job Alert`,
    description: `Job: **${data.jobName}**`,
    color,
    fields: [
      {
        name: 'Status',
        value: data.status.replace('_', ' ').toUpperCase(),
        inline: true,
      },
      {
        name: 'Execution ID',
        value: `${data.executionId.substring(0, 8)}...`,
        inline: true,
      },
      ...(data.duration
        ? [
            {
              name: 'Duration',
              value: `${(data.duration / 1000).toFixed(1)}s`,
              inline: true,
            },
          ]
        : []),
      ...(data.error
        ? [
            {
              name: 'Error',
              value: data.error.substring(0, 200),
              inline: false,
            },
          ]
        : []),
      ...(data.results
        ? [
            {
              name: 'Results',
              value: `✅ Completed: ${data.results.completed || 0}\n❌ Failed: ${data.results.failed || 0}\n⏳ Processing: ${data.results.stillProcessing || 0}\n🐛 Errors: ${data.results.errors || 0}`,
              inline: false,
            },
          ]
        : []),
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Viecom Cron Monitor',
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    console.log('[Alerts] Discord alert sent successfully');
  } catch (error) {
    console.error('[Alerts] Failed to send Discord alert:', error);
  }
}

/**
 * Send cron job alert to configured channels
 * Automatically sends to Slack and/or Discord based on environment variables
 */
export async function sendCronAlert(data: CronAlertData): Promise<void> {
  console.log('[Alerts] Sending cron alert:', {
    status: data.status,
    jobName: data.jobName,
    executionId: data.executionId,
  });

  // Send to all configured channels in parallel
  await Promise.allSettled([sendSlackAlert(data), sendDiscordAlert(data)]);
}

/**
 * Check if alert should be sent based on results
 */
export function shouldSendAlert(results: {
  completed: number;
  failed: number;
  stillProcessing: number;
  errors: number;
  totalFound: number;
}): boolean {
  // Send alert if:
  // 1. Error rate > 50%
  const errorRate = results.totalFound > 0 ? results.errors / results.totalFound : 0;
  if (errorRate > 0.5 && results.totalFound >= 3) {
    return true;
  }

  // 2. Many tasks failed
  if (results.failed >= 5) {
    return true;
  }

  // 3. Processing errors
  if (results.errors >= 3) {
    return true;
  }

  return false;
}
