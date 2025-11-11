/**
 * 优先队列批量处理器
 * 实现智能并发控制、优先级调度和错误fallback
 */

import { randomUUID } from 'node:crypto';
import { db } from '@/server/db';
import { batchGenerationJob, generatedAsset } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { creditService } from '@/server/services/credit-service';
import { r2StorageService } from '@/lib/storage/r2';
import { getKieApiService } from '@/lib/kie/kie-api';
import { getVideoModelInfo } from '@/config/credits.config';
import {
  getBatchConfig,
  calculateActualConcurrency,
  getPollingConfig,
} from '@/config/batch.config';

export interface VideoTask {
  rowIndex: number;
  model: 'sora-2' | 'sora-2-pro';
  resolution: '720p' | '1080p';
  duration: 10 | 15;
  prompt: string;
  enhancedPrompt: string;
  imageUrl?: string;
  aspectRatio?: string;
  productName?: string;
  productDescription?: string;
}

interface TaskResult {
  rowIndex: number;
  success: boolean;
  assetId?: string;
  assetUrl?: string;
  error?: string;
  retries?: number;
}

interface ProcessingStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  fastQueueCompleted: number;
  slowQueueCompleted: number;
}

/**
 * 优先队列处理器
 */
export class PriorityQueueProcessor {
  private userPlan: 'free' | 'pro' | 'proplus';
  private userId: string;
  private jobId: string;
  private config: ReturnType<typeof getBatchConfig>;
  private kieApiService: ReturnType<typeof getKieApiService>;
  
  // 错误fallback配置
  private maxRetries = 3;
  private retryDelay = 2000; // 2秒
  private concurrencyFallback = true; // 启用并发降级
  private failureThreshold = 0.3; // 失败率超过30%触发降级
  
  constructor(userId: string, jobId: string, userPlan: string) {
    this.userId = userId;
    this.jobId = jobId;
    this.userPlan = ['pro', 'proplus'].includes(userPlan) ? userPlan as any : 'free';
    this.config = getBatchConfig(this.userPlan);
    this.kieApiService = getKieApiService();
  }
  
  /**
   * 处理批量任务（优先队列模式）
   */
  async processBatch(tasks: VideoTask[]): Promise<ProcessingStats> {
    console.log(
      `[Job ${this.jobId}] Starting priority queue processing: ${tasks.length} tasks`
    );
    
    const stats: ProcessingStats = {
      total: tasks.length,
      processed: 0,
      successful: 0,
      failed: 0,
      fastQueueCompleted: 0,
      slowQueueCompleted: 0,
    };
    
    // 1. 按优先级分组
    const taskGroups = this.groupByPriority(tasks);
    
    console.log(
      `[Job ${this.jobId}] Task distribution: ` +
      `Fast=${taskGroups.fast.length}, Slow=${taskGroups.slow.length}`
    );
    
    // 2. 检查积分
    await this.checkCredits(tasks);
    
    try {
      // 3. 先处理快速队列（720P优先）
      console.log(`[Job ${this.jobId}] ⚡ Phase 1: Processing fast tasks (720P)`);
      const fastResults = await this.processTaskGroup(
        taskGroups.fast,
        'fast'
      );
      
      stats.processed += fastResults.length;
      stats.successful += fastResults.filter(r => r.success).length;
      stats.failed += fastResults.filter(r => !r.success).length;
      stats.fastQueueCompleted = fastResults.filter(r => r.success).length;
      
      await this.updateJobProgress(stats);
      
      console.log(
        `[Job ${this.jobId}] ✅ Fast queue completed: ` +
        `${stats.fastQueueCompleted}/${taskGroups.fast.length} succeeded`
      );
      
      // 4. 再处理慢速队列（1080P）
      if (taskGroups.slow.length > 0) {
        console.log(`[Job ${this.jobId}] 🐢 Phase 2: Processing slow tasks (1080P)`);
        const slowResults = await this.processTaskGroup(
          taskGroups.slow,
          'slow'
        );
        
        stats.processed += slowResults.length;
        stats.successful += slowResults.filter(r => r.success).length;
        stats.failed += slowResults.filter(r => !r.success).length;
        stats.slowQueueCompleted = slowResults.filter(r => r.success).length;
        
        await this.updateJobProgress(stats);
        
        console.log(
          `[Job ${this.jobId}] ✅ Slow queue completed: ` +
          `${stats.slowQueueCompleted}/${taskGroups.slow.length} succeeded`
        );
      }
      
      // 5. 标记任务完成
      await db
        .update(batchGenerationJob)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(batchGenerationJob.id, this.jobId));
      
      console.log(
        `[Job ${this.jobId}] 🎉 All tasks completed! ` +
        `Success: ${stats.successful}/${stats.total}, Failed: ${stats.failed}`
      );
      
    } catch (error) {
      console.error(`[Job ${this.jobId}] ❌ Batch processing error:`, error);
      
      await db
        .update(batchGenerationJob)
        .set({
          status: 'failed',
          errorReport: JSON.stringify({ error: String(error) }),
        })
        .where(eq(batchGenerationJob.id, this.jobId));
      
      throw error;
    }
    
    return stats;
  }
  
  /**
   * 按优先级分组任务
   */
  private groupByPriority(tasks: VideoTask[]) {
    const fast: VideoTask[] = [];
    const slow: VideoTask[] = [];
    
    for (const task of tasks) {
      // 720P 或 1080P 10秒 = 快速
      // 1080P 15秒 = 慢速
      const isFast =
        task.resolution === '720p' ||
        (task.resolution === '1080p' && task.duration === 10);
      
      if (isFast) {
        fast.push(task);
      } else {
        slow.push(task);
      }
    }
    
    // 快速任务内部再按时长排序（10秒优先）
    fast.sort((a, b) => a.duration - b.duration);
    
    return { fast, slow };
  }
  
  /**
   * 检查积分是否充足
   */
  private async checkCredits(tasks: VideoTask[]) {
    const totalCredits = tasks.reduce((sum, task) => {
      const { credits } = getVideoModelInfo({
        model: task.model,
        resolution: task.resolution,
        duration: task.duration,
      });
      return sum + credits;
    }, 0);
    
    const userCredits = await creditService.getCreditBalance(this.userId);
    
    if (userCredits < totalCredits) {
      throw new Error(
        `Insufficient credits. Required: ${totalCredits}, Available: ${userCredits}`
      );
    }
    
    console.log(
      `[Job ${this.jobId}] Credit check passed: ${totalCredits}/${userCredits} credits`
    );
  }
  
  /**
   * 处理任务组
   */
  private async processTaskGroup(
    tasks: VideoTask[],
    groupType: 'fast' | 'slow'
  ): Promise<TaskResult[]> {
    if (tasks.length === 0) return [];
    
    const results: TaskResult[] = [];
    const { batchSize } = this.config.userFacing;
    const chunks = this.chunkArray(tasks, batchSize);
    
    let currentConcurrency: number | null = null;
    let failureCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      console.log(
        `[Job ${this.jobId}] ${groupType} batch ${i + 1}/${chunks.length}: ` +
        `${chunk.length} tasks`
      );
      
      // 计算这批任务的并发数
      if (currentConcurrency === null) {
        currentConcurrency = this.calculateChunkConcurrency(chunk);
      }
      
      console.log(
        `[Job ${this.jobId}] Using concurrency=${currentConcurrency}`
      );
      
      // 并发处理当前批次
      const batchResults = await this.processConcurrent(
        chunk,
        currentConcurrency
      );
      
      results.push(...batchResults);
      
      // 检查失败率，决定是否降低并发
      if (this.concurrencyFallback) {
        const batchFailures = batchResults.filter(r => !r.success).length;
        failureCount += batchFailures;
        const totalProcessed = results.length;
        const failureRate = failureCount / totalProcessed;
        
        if (failureRate > this.failureThreshold && totalProcessed >= 10) {
          const oldConcurrency = currentConcurrency;
          currentConcurrency = Math.max(1, Math.floor(currentConcurrency * 0.6));
          
          console.warn(
            `[Job ${this.jobId}] ⚠️ High failure rate (${(failureRate * 100).toFixed(1)}%), ` +
            `reducing concurrency: ${oldConcurrency} → ${currentConcurrency}`
          );
        }
      }
      
      // 批次间休息
      if (i < chunks.length - 1) {
        await this.sleep(2000);
      }
    }
    
    return results;
  }
  
  /**
   * 计算批次的实际并发数
   */
  private calculateChunkConcurrency(chunk: VideoTask[]): number {
    // 获取这批任务的主要特征
    const resolution720Count = chunk.filter(t => t.resolution === '720p').length;
    const avgResolution = resolution720Count > chunk.length / 2 ? '720p' : '1080p';
    
    const avgDuration = Math.round(
      chunk.reduce((sum, t) => sum + t.duration, 0) / chunk.length
    ) as 10 | 15;
    
    const model = chunk[0].model; // 假设同批次同模型
    
    return calculateActualConcurrency(
      this.userPlan,
      model,
      avgResolution,
      avgDuration
    );
  }
  
  /**
   * 并发处理任务
   */
  private async processConcurrent(
    tasks: VideoTask[],
    concurrency: number
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(task => this.processTaskWithRetry(task))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Promise rejected
          results.push({
            rowIndex: -1,
            success: false,
            error: result.reason?.message || 'Unknown error',
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * 处理单个任务（带重试）
   */
  private async processTaskWithRetry(task: VideoTask): Promise<TaskResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `[Job ${this.jobId}] Row ${task.rowIndex}, Attempt ${attempt}/${this.maxRetries}: ` +
          `${task.model} ${task.resolution} ${task.duration}s`
        );
        
        const result = await this.processTask(task);
        return { ...result, retries: attempt - 1 };
        
      } catch (error) {
        lastError = error as Error;
        
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === this.maxRetries) {
          break;
        }
        
        // 指数退避
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(
          `[Job ${this.jobId}] Row ${task.rowIndex} failed, retrying in ${delay}ms...`
        );
        await this.sleep(delay);
      }
    }
    
    return {
      rowIndex: task.rowIndex,
      success: false,
      error: lastError?.message || 'Unknown error',
      retries: this.maxRetries,
    };
  }
  
  /**
   * 处理单个任务
   */
  private async processTask(task: VideoTask): Promise<TaskResult> {
    const { modelKey, credits, apiModel } = getVideoModelInfo({
      model: task.model,
      resolution: task.resolution,
      duration: task.duration,
    });
    
    // 1. 检查积分
    const hasCredits = await creditService.hasEnoughCredits(this.userId, credits);
    if (!hasCredits) {
      throw new Error(`Insufficient credits: ${credits} required`);
    }
    
    // 2. 创建生成任务
    const mode = task.imageUrl ? 'i2v' : 't2v';
    const aspectRatioMap: Record<string, 'square' | 'portrait' | 'landscape'> = {
      '1:1': 'square',
      '9:16': 'portrait',
      '16:9': 'landscape',
      '4:3': 'landscape',
      '3:4': 'portrait',
    };
    const kieAspectRatio = aspectRatioMap[task.aspectRatio || '16:9'] || 'landscape';
    
    const taskResponse = await this.kieApiService.generateVideo({
      prompt: task.enhancedPrompt,
      imageUrls: task.imageUrl ? [task.imageUrl] : undefined,
      aspectRatio: kieAspectRatio,
      quality: task.resolution === '1080p' ? 'high' : 'standard',
    });
    
    // 3. 轮询结果（带智能间隔）
    const startTime = Date.now();
    const pollConfig = getPollingConfig(
      this.userPlan,
      task.resolution
    );
    
    const videoResult = await this.pollWithAdaptiveInterval(
      taskResponse.data.taskId,
      task.resolution,
      pollConfig.timeout,
      startTime
    );
    
    if (!videoResult.videoUrl) {
      throw new Error('Video generation failed: No video URL');
    }
    
    // 4. 下载并上传到 R2
    const videoResponse = await fetch(videoResult.videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    
    const assetId = randomUUID();
    const r2Result = await r2StorageService.uploadAsset(
      videoBuffer,
      `batch-${this.jobId}-${task.rowIndex}-${assetId}.mp4`,
      'video/mp4',
      'video'
    );
    
    // 5. 扣除积分
    await creditService.spendCredits({
      userId: this.userId,
      amount: credits,
      source: 'generation',
      description: `Batch video generation - ${modelKey}`,
      referenceId: `batch-${this.jobId}-${task.rowIndex}`,
    });
    
    // 6. 保存到数据库
    await db.insert(generatedAsset).values({
      id: assetId,
      userId: this.userId,
      batchJobId: this.jobId,
      assetType: 'video',
      generationMode: mode,
      prompt: task.prompt,
      enhancedPrompt: task.enhancedPrompt,
      model: modelKey,
      r2Key: r2Result.key,
      publicUrl: r2Result.url,
      status: 'completed',
      creditsSpent: credits,
      metadata: {
        rowIndex: task.rowIndex,
        resolution: task.resolution,
        duration: task.duration,
        productName: task.productName,
        productDescription: task.productDescription,
      } as any,
    });
    
    console.log(
      `[Job ${this.jobId}] ✅ Row ${task.rowIndex} completed: ${assetId}`
    );
    
    return {
      rowIndex: task.rowIndex,
      success: true,
      assetId,
      assetUrl: r2Result.url,
    };
  }
  
  /**
   * 智能轮询（自适应间隔）
   */
  private async pollWithAdaptiveInterval(
    taskId: string,
    resolution: '720p' | '1080p',
    timeout: number,
    startTime: number
  ): Promise<{ videoUrl?: string; status: string }> {
    const maxAttempts = Math.floor(timeout / 3000);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.kieApiService.getTaskStatus(taskId);
      
      if (status.data?.status === 'completed' || status.data?.state === 'success') {
        const videoUrl = status.data?.result?.videoUrl || status.data?.result?.resultUrls?.[0];
        if (videoUrl) {
          return { videoUrl, status: 'completed' };
        }
      }
      
      if (status.data?.status === 'failed' || status.data?.state === 'fail') {
        throw new Error(status.data?.error || status.data?.failMsg || 'Task failed');
      }
      
      // 计算智能间隔
      const elapsedMs = Date.now() - startTime;
      const pollConfig = getPollingConfig(this.userPlan, resolution, elapsedMs);
      
      if (attempt < maxAttempts - 1) {
        await this.sleep(pollConfig.interval);
      }
    }
    
    throw new Error('Task polling timeout');
  }
  
  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'Rate limit',
      'Too many requests',
      '429',
      '500',
      '502',
      '503',
      '504',
      'timeout',
    ];
    
    const errorMessage = error?.message || String(error);
    return retryableErrors.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  /**
   * 更新任务进度
   */
  private async updateJobProgress(stats: ProcessingStats) {
    await db
      .update(batchGenerationJob)
      .set({
        processedRows: stats.processed,
        successfulRows: stats.successful,
        failedRows: stats.failed,
        updatedAt: new Date(),
      })
      .where(eq(batchGenerationJob.id, this.jobId));
  }
  
  /**
   * 工具函数
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
