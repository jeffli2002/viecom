import { auth } from '@/lib/auth/auth';
import { isTestModeRequest } from '@/lib/utils/test-mode';
import { getTestBatchJob } from '@/lib/workflow/test-batch-store';
import { db } from '@/server/db';
import { batchGenerationJob } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const testMode = isTestModeRequest(request);

    if (testMode) {
      const job = getTestBatchJob(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: job.id,
          jobName: job.jobName,
          status: job.status,
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          successfulRows: job.successfulRows,
          failedRows: job.failedRows,
          progress: job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0,
          zipFileUrl: null,
          errorReport: null,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt,
        },
      });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [job] = await db
      .select()
      .from(batchGenerationJob)
      .where(eq(batchGenerationJob.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get signed URL for ZIP file if available
    let zipFileUrl: string | null = null;
    if (job.zipFileKey) {
      const { r2StorageService } = await import('@/lib/storage/r2');
      zipFileUrl = await r2StorageService.getSignedUrl(job.zipFileKey, 3600);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        jobName: job.jobName,
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successfulRows: job.successfulRows,
        failedRows: job.failedRows,
        progress: job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0,
        zipFileUrl,
        errorReport: job.errorReport ? JSON.parse(job.errorReport) : null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get job status',
      },
      { status: 500 }
    );
  }
}


