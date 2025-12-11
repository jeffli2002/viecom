import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { cronJobExecutions } from '@/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verify admin
    await requireAdmin();

    // Get recent executions
    const executions = await db
      .select()
      .from(cronJobExecutions)
      .where(eq(cronJobExecutions.jobName, 'process-stuck-tasks'))
      .orderBy(desc(cronJobExecutions.startedAt))
      .limit(50);

    // Calculate stats
    const completedExecutions = executions.filter((e) => e.status === 'completed');
    const successRate =
      executions.length > 0 ? (completedExecutions.length / executions.length) * 100 : 0;

    const totalDuration = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgDuration =
      completedExecutions.length > 0 ? totalDuration / completedExecutions.length : 0;

    const totalTasksRecovered = executions.reduce((sum, e) => sum + (e.results?.completed || 0), 0);

    const totalTasksFailed = executions.reduce((sum, e) => sum + (e.results?.failed || 0), 0);

    const stats = {
      totalExecutions: executions.length,
      successRate,
      avgDuration,
      totalTasksRecovered,
      totalTasksFailed,
    };

    const response = NextResponse.json({
      executions,
      stats,
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin cron jobs list error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch cron job data' }, { status: 500 });
  }
}
