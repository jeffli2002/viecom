import { randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth/auth';
import { isTestModeRequest } from '@/lib/utils/test-mode';
import type { BatchTemplateRow } from '@/lib/workflow/template-generator';
import { createTestBatchJob } from '@/lib/workflow/test-batch-store';
import { workflowEngine } from '@/lib/workflow/workflow-engine';
import { db } from '@/server/db';
import { batchGenerationJob } from '@/server/db/schema';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const isTestMode = isTestModeRequest(request);
    let userId = 'test-user-id';

    if (!isTestMode) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = session.user.id;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const generationType = formData.get('generationType') as 'image' | 'video' | null;
    const mode = formData.get('mode') as 't2i' | 'i2i' | 't2v' | 'i2v' | null;
    const aspectRatio = formData.get('aspectRatio') as string | null;
    const style = formData.get('style') as string | null;
    const columnMappingStr = formData.get('columnMapping') as string | null;
    const autoPublish = formData.get('autoPublish') === 'true'; // Whether to auto-publish

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Generation type and mode are now optional - can be read from CSV
    // But if provided, validate them
    if (generationType && !['image', 'video'].includes(generationType)) {
      return NextResponse.json(
        { error: 'Generation type must be "image" or "video"' },
        { status: 400 }
      );
    }

    if (mode && !['t2i', 'i2i', 't2v', 'i2v'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid generation mode' }, { status: 400 });
    }

    if (isTestMode) {
      return await handleTestBatchRequest({
        file,
        generationType,
        mode,
        userId,
      });
    }

    // Create batch job record
    const jobId = randomUUID();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to R2
    const { r2StorageService } = await import('@/lib/storage/r2');
    const { key: csvFileKey } = await r2StorageService.uploadBatchFile(fileBuffer, file.name);

    // Parse file to get row count using template generator
    const { templateGenerator } = await import('@/lib/workflow/template-generator');
    const rows = await templateGenerator.parseTemplateFile(fileBuffer, file.name);
    const totalRows = rows.length;

    // Create job record
    await db.insert(batchGenerationJob).values({
      id: jobId,
      userId,
      jobName: file.name,
      status: 'pending',
      totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      csvFileKey,
      columnMapping: columnMappingStr ? JSON.parse(columnMappingStr) : null,
    });

    // Process in background (for now, return job ID)
    // In production, use a queue system like BullMQ or similar
    processBatchJob(jobId, userId, csvFileKey, {
      generationType: generationType || undefined,
      mode: mode || undefined,
      aspectRatio: aspectRatio || undefined,
      style: style || undefined,
      columnMapping: columnMappingStr ? JSON.parse(columnMappingStr) : undefined,
      autoPublish,
    }).catch((error) => {
      console.error('Background batch processing error:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'pending',
        totalRows,
      },
    });
  } catch (error) {
    console.error('Batch workflow error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Batch workflow failed',
      },
      { status: 500 }
    );
  }
}

async function handleTestBatchRequest({
  file,
  generationType,
  mode,
  userId,
}: {
  file: File;
  generationType: 'image' | 'video' | null;
  mode: 't2i' | 'i2i' | 't2v' | 'i2v' | null;
  userId: string;
}) {
  const { templateGenerator } = await import('@/lib/workflow/template-generator');
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const rows = await templateGenerator.parseTemplateFile(fileBuffer, file.name || 'batch.csv');
  const type = inferGenerationType(rows, generationType, mode);
  const job = createTestBatchJob({
    jobName: file.name || 'test-batch.csv',
    userId,
    type,
    rows,
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      totalRows: job.totalRows,
    },
  });
}

function inferGenerationType(
  rows: BatchTemplateRow[],
  explicitType?: 'image' | 'video' | null,
  explicitMode?: 't2i' | 'i2i' | 't2v' | 'i2v' | null
): 'image' | 'video' {
  if (explicitType) {
    return explicitType;
  }

  const mode = explicitMode || rows.find((row) => row.generationMode)?.generationMode || 't2i';

  return mode.includes('v') ? 'video' : 'image';
}

/**
 * Process batch job in background
 */
async function processBatchJob(
  jobId: string,
  userId: string,
  csvFileKey: string,
  options: {
    generationType?: 'image' | 'video';
    mode?: 't2i' | 'i2i' | 't2v' | 'i2v';
    aspectRatio?: string;
    style?: string;
    columnMapping?: Record<string, string>;
    autoPublish?: boolean;
  }
) {
  try {
    const { db } = await import('@/server/db');
    const { batchGenerationJob } = await import('@/server/db/schema');
    const { eq } = await import('drizzle-orm');

    // Update job status
    await db
      .update(batchGenerationJob)
      .set({ status: 'processing' })
      .where(eq(batchGenerationJob.id, jobId));

    // Get file from R2
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { S3Client } = await import('@aws-sdk/client-s3');
    const { env } = await import('@/env');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: csvFileKey,
      })
    );

    if (!getObjectResponse.Body) {
      throw new Error('Missing batch file payload');
    }

    const fileBuffer = Buffer.from(await getObjectResponse.Body.transformToByteArray());

    // Process batch file with auto-publish option
    const result = await workflowEngine.processBatchFile(userId, fileBuffer, 'batch.csv', {
      ...options,
      autoPublish: options.autoPublish ?? false, // Default to false - let user choose
      jobId, // Pass jobId to link assets
    });

    // Save generated assets to database
    if (result.results && result.results.length > 0) {
      // TODO: Persist generated assets once workflow returns structured metadata
    }

    // Update job status
    const { totalRows } = await db
      .select({ totalRows: batchGenerationJob.totalRows })
      .from(batchGenerationJob)
      .where(eq(batchGenerationJob.id, jobId))
      .then((rows) => rows[0] || { totalRows: 0 });

    const successfulRows = result.results?.filter((r) => r.status === 'completed').length || 0;
    const failedRows = (result.results?.length || totalRows) - successfulRows;

    await db
      .update(batchGenerationJob)
      .set({
        status: 'completed',
        processedRows: totalRows,
        successfulRows,
        failedRows,
        completedAt: new Date(),
      })
      .where(eq(batchGenerationJob.id, jobId));

    return result;
  } catch (error) {
    console.error('Batch job processing error:', error);
    const { db } = await import('@/server/db');
    const { batchGenerationJob } = await import('@/server/db/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(batchGenerationJob)
      .set({
        status: 'failed',
        errorReport: JSON.stringify({ error: String(error) }),
      })
      .where(eq(batchGenerationJob.id, jobId));

    throw error;
  }
}
