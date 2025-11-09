import { randomUUID } from 'node:crypto';
import type { BatchTemplateRow } from './template-generator';

type TestAssetStatus = 'completed' | 'failed';

export interface TestBatchAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  enhancedPrompt?: string;
  model?: string;
  status: TestAssetStatus;
  error?: string;
  rowIndex: number;
}

export interface TestBatchJob {
  id: string;
  jobName: string;
  userId: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assets: TestBatchAsset[];
}

const testBatchJobs = new Map<string, TestBatchJob>();

interface CreateJobParams {
  userId: string;
  jobName: string;
  type: 'image' | 'video';
  rows: BatchTemplateRow[];
}

export function createTestBatchJob(params: CreateJobParams): TestBatchJob {
  const now = new Date().toISOString();
  const assets: TestBatchAsset[] = params.rows.map((row, index) => {
    const assetType = params.type;
    const url =
      assetType === 'image'
        ? `https://placehold.co/1024x1024?text=Image+${index + 1}`
        : `https://example.com/video-${index + 1}.mp4`;

    return {
      id: randomUUID(),
      url,
      type: assetType,
      prompt: row.prompt || `Row ${index + 1}`,
      enhancedPrompt: row.prompt ? `${row.prompt} (test-mode)` : undefined,
      model: row.model || (assetType === 'image' ? 'nano-banana' : 'sora-2'),
      status: 'completed',
      rowIndex: index,
    };
  });

  const job: TestBatchJob = {
    id: `test-job-${randomUUID()}`,
    jobName: params.jobName || 'test-batch.csv',
    userId: params.userId,
    type: params.type,
    status: 'completed',
    totalRows: params.rows.length,
    processedRows: params.rows.length,
    successfulRows: params.rows.length,
    failedRows: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    assets,
  };

  testBatchJobs.set(job.id, job);
  return job;
}

export function getTestBatchJob(jobId: string): TestBatchJob | null {
  return testBatchJobs.get(jobId) ?? null;
}

export function clearTestBatchJobs(): void {
  testBatchJobs.clear();
}
