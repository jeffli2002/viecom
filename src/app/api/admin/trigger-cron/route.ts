import { env } from '@/env';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

/**
 * Manually trigger the cron job for testing/debugging
 * POST /api/admin/trigger-cron
 */
export async function POST() {
  try {
    // Verify admin
    await requireAdmin();

    if (!env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    console.log('[Admin] Manually triggering cron job...');

    // Call the cron endpoint with proper authorization
    const cronUrl = `${env.NEXT_PUBLIC_APP_URL}/api/cron/process-stuck-tasks`;

    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Cron job failed');
    }

    console.log('[Admin] Cron job completed:', data);

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      results: data.results,
      duration: data.duration,
      executionId: data.executionId,
    });
  } catch (error: unknown) {
    console.error('Admin trigger cron error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to trigger cron job',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
