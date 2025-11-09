import { randomUUID } from 'node:crypto';
import { env } from '@/env';
import { analyzeBrandTone } from '@/lib/brand/brand-tone-analyzer';
import { creditService } from '@/lib/credits';
import { getQuotaUsageByService, updateQuotaUsage } from '@/lib/quota/quota-service';
import { r2StorageService } from '@/lib/storage/r2';
import * as XLSX from 'xlsx';

export interface WorkflowInput {
  companyUrl?: string;
  productImages?: string[]; // Base64 or URLs
  simpleRequirement: string; // User's simple description
  generationType: 'image' | 'video';
  mode: 't2i' | 'i2i' | 't2v' | 'i2v';
  count?: number; // Number of variations to generate
  model?: string;
  aspectRatio?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
}

export interface WorkflowResult {
  workflowId: string;
  steps: WorkflowStep[];
  brandAnalysis?: any;
  enhancedPrompts: string[];
  generatedAssets: Array<{
    id: string;
    url: string;
    prompt: string;
    type: 'image' | 'video';
  }>;
  zipFileUrl?: string;
  totalCreditsSpent: number;
}

export class WorkflowEngine {
  /**
   * Execute complete AI Agent workflow
   */
  async executeWorkflow(
    userId: string,
    input: WorkflowInput
  ): Promise<{ workflowId: string; result: WorkflowResult }> {
    const workflowId = randomUUID();
    const steps: WorkflowStep[] = [];
    const enhancedPrompts: string[] = [];
    const generatedAssets: WorkflowResult['generatedAssets'] = [];
    let brandAnalysis: any = null;
    let totalCreditsSpent = 0;

    try {
      // Step 1: Analyze brand tone (if company URL provided)
      if (input.companyUrl) {
        const brandStep: WorkflowStep = {
          id: 'brand-analysis',
          name: 'Analyzing Brand Tone',
          status: 'processing',
          progress: 0,
        };
        steps.push(brandStep);

        try {
          brandAnalysis = await analyzeBrandTone(input.companyUrl);
          brandStep.status = 'completed';
          brandStep.progress = 100;
          brandStep.result = brandAnalysis;
        } catch (error) {
          brandStep.status = 'failed';
          brandStep.error = error instanceof Error ? error.message : 'Brand analysis failed';
          // Continue workflow even if brand analysis fails
        }
      }

      // Step 2: Generate enhanced prompts
      const promptStep: WorkflowStep = {
        id: 'prompt-enhancement',
        name: 'Enhancing Prompts',
        status: 'processing',
        progress: 0,
      };
      steps.push(promptStep);

      const basePrompt = input.simpleRequirement;
      const count = input.count || 1;

      // Generate multiple prompt variations
      for (let i = 0; i < count; i++) {
        const enhancedPrompt = await this.enhancePrompt(
          basePrompt,
          brandAnalysis,
          input.productImages?.[i],
          i
        );
        enhancedPrompts.push(enhancedPrompt);
        promptStep.progress = Math.round(((i + 1) / count) * 100);
      }

      promptStep.status = 'completed';
      promptStep.progress = 100;
      promptStep.result = { prompts: enhancedPrompts };

      // Step 3: Generate assets
      const generationStep: WorkflowStep = {
        id: 'asset-generation',
        name: `Generating ${input.generationType === 'image' ? 'Images' : 'Videos'}`,
        status: 'processing',
        progress: 0,
      };
      steps.push(generationStep);

      for (let i = 0; i < enhancedPrompts.length; i++) {
        const prompt = enhancedPrompts[i];
        const baseImage = input.productImages?.[i];

        try {
          const asset = await this.generateAsset(
            userId,
            {
              prompt,
              mode: input.mode,
              type: input.generationType,
              baseImage,
              model: input.model || 'nano-banana',
              aspectRatio: input.aspectRatio || '1:1',
            },
            workflowId
          );

          generatedAssets.push(asset);
          totalCreditsSpent += asset.creditsSpent || 0;
          generationStep.progress = Math.round(((i + 1) / enhancedPrompts.length) * 100);
        } catch (error) {
          console.error(`Failed to generate asset ${i + 1}:`, error);
          // Continue with next asset
        }
      }

      generationStep.status = 'completed';
      generationStep.progress = 100;
      generationStep.result = { assets: generatedAssets };

      // Step 4: Package and upload ZIP file
      const packageStep: WorkflowStep = {
        id: 'packaging',
        name: 'Packaging Assets',
        status: 'processing',
        progress: 0,
      };
      steps.push(packageStep);

      const zipFileUrl = await this.packageAssets(generatedAssets, workflowId);
      packageStep.status = 'completed';
      packageStep.progress = 100;
      packageStep.result = { zipFileUrl };

      const result: WorkflowResult = {
        workflowId,
        steps,
        brandAnalysis,
        enhancedPrompts,
        generatedAssets,
        zipFileUrl,
        totalCreditsSpent,
      };

      return { workflowId, result };
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw error;
    }
  }

  /**
   * Enhance prompt with brand context
   */
  private async enhancePrompt(
    basePrompt: string,
    brandAnalysis: any,
    productImage?: string,
    variationIndex = 0
  ): Promise<string> {
    const deepseekKey = env.DEEPSEEK_API_KEY;

    if (!deepseekKey) {
      return basePrompt;
    }

    try {
      const contextInfo: string[] = [];

      if (brandAnalysis) {
        if (brandAnalysis.brandTone?.length > 0) {
          contextInfo.push(`Brand tone: ${brandAnalysis.brandTone.join(', ')}`);
        }
        if (brandAnalysis.styleKeywords?.length > 0) {
          contextInfo.push(`Style: ${brandAnalysis.styleKeywords.join(', ')}`);
        }
        if (brandAnalysis.colorPalette?.length > 0) {
          contextInfo.push(`Colors: ${brandAnalysis.colorPalette.join(', ')}`);
        }
        if (brandAnalysis.productFeatures?.length > 0) {
          contextInfo.push(`Product features: ${brandAnalysis.productFeatures.join(', ')}`);
        }
      }

      const contextString = contextInfo.length > 0 ? `\n\nContext:\n${contextInfo.join('\n')}` : '';
      const variationNote =
        variationIndex > 0
          ? `\n\nGenerate variation ${variationIndex + 1} with slight differences.`
          : '';

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert AI prompt engineer for e-commerce product image/video generation. Enhance prompts with vivid artistic direction, lighting, composition, and camera/style cues. Incorporate brand tone and product features naturally. Only return the enhanced prompt text.',
            },
            {
              role: 'user',
              content: `Enhance this e-commerce product generation prompt:${contextString}${variationNote}\n\nPrompt: ${basePrompt}\n\nRespond with the enhanced prompt only.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return basePrompt;
      }

      const data = await response.json();
      const enhanced = data.choices?.[0]?.message?.content?.trim() || basePrompt;
      return enhanced;
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      return basePrompt;
    }
  }

  /**
   * Generate single asset
   */
  private async generateAsset(
    userId: string,
    params: {
      prompt: string;
      mode: 't2i' | 'i2i' | 't2v' | 'i2v';
      type: 'image' | 'video';
      baseImage?: string;
      model?: string;
      aspectRatio?: string;
    },
    workflowId: string
  ): Promise<WorkflowResult['generatedAssets'][0] & { creditsSpent: number }> {
    const { prompt, mode, type, baseImage, model = 'nano-banana', aspectRatio = '1:1' } = params;

    // Check credits and quota
    const creditCost = type === 'image' ? 5 : 15; // Simplified - should use getModelCost
    const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);

    if (!hasCredits) {
      throw new Error('Insufficient credits');
    }

    // Generate asset based on type
    if (type === 'image') {
      return await this.generateImage(
        userId,
        prompt,
        mode,
        baseImage,
        model,
        aspectRatio,
        creditCost
      );
    } else {
      return await this.generateVideo(userId, prompt, mode, baseImage, creditCost);
    }
  }

  /**
   * Generate image using KIE API
   */
  private async generateImage(
    userId: string,
    prompt: string,
    mode: 't2i' | 'i2i',
    baseImage?: string,
    model = 'nano-banana',
    aspectRatio = '1:1',
    creditCost: number
  ): Promise<WorkflowResult['generatedAssets'][0] & { creditsSpent: number }> {
    const { getKieApiService } = await import('@/lib/kie/kie-api');
    const kieApiService = getKieApiService();
    const { r2StorageService } = await import('@/lib/storage/r2');
    const { randomUUID } = await import('node:crypto');

    // Map aspect ratio to KIE format
    const aspectRatioMap: Record<string, 'square' | 'portrait' | 'landscape'> = {
      '1:1': 'square',
      '9:16': 'portrait',
      '16:9': 'landscape',
      '4:3': 'landscape',
      '3:2': 'landscape',
    };
    const kieAspectRatio = aspectRatioMap[aspectRatio] || 'square';

    // Create image generation task
    const taskResponse = await kieApiService.generateImage({
      prompt,
      imageUrl: mode === 'i2i' && baseImage ? baseImage : undefined,
      aspectRatio: kieAspectRatio,
      quality: 'standard',
    });

    const taskId = taskResponse.data.taskId;

    // Poll for task completion
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 5 minutes

    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await kieApiService.getTaskStatus(taskId);
      status = statusResponse.data.status;

      if (status === 'completed') {
        const imageUrl = statusResponse.data.result?.imageUrl;
        if (!imageUrl) {
          throw new Error('Image generation completed but no image URL found');
        }

        // Download image and upload to R2
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to download generated image');
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const r2Result = await r2StorageService.uploadAsset(
          imageBuffer,
          `workflow-image-${randomUUID()}.png`,
          'image/png',
          'image'
        );

        // Spend credits
        await creditService.spendCredits({
          userId,
          amount: creditCost,
          source: 'api_call',
          description: `Workflow image generation (${mode})`,
          metadata: {
            workflowId: 'workflow-id',
            mode,
            model,
            taskId,
          },
        });

        // Update quota
        const dailyPeriod = new Date().toISOString().split('T')[0];
        await updateQuotaUsage({
          userId,
          service: 'image_generation',
          amount: 1,
          period: dailyPeriod,
        });

        return {
          id: randomUUID(),
          url: r2Result.url,
          prompt,
          type: 'image',
          creditsSpent: creditCost,
        };
      }

      if (status === 'failed') {
        throw new Error(statusResponse.data.error || 'Image generation failed');
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Image generation timeout');
      }
    }

    throw new Error('Unexpected image generation status');
  }

  /**
   * Generate video using KIE API
   */
  private async generateVideo(
    userId: string,
    prompt: string,
    mode: 't2v' | 'i2v',
    baseImage?: string,
    creditCost: number
  ): Promise<WorkflowResult['generatedAssets'][0] & { creditsSpent: number }> {
    const { getKieApiService } = await import('@/lib/kie/kie-api');
    const kieApiService = getKieApiService();
    const { r2StorageService } = await import('@/lib/storage/r2');
    const { randomUUID } = await import('node:crypto');

    // Create video generation task
    const taskResponse = await kieApiService.generateVideo({
      prompt,
      imageUrls: mode === 'i2v' && baseImage ? [baseImage] : undefined,
      aspectRatio: 'landscape', // Default, can be made configurable
      quality: 'standard',
    });

    const taskId = taskResponse.data.taskId;

    // Poll for task completion
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 120; // Wait up to 10 minutes

    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await kieApiService.getTaskStatus(taskId);
      status = statusResponse.data.status;

      if (status === 'completed') {
        const videoUrl = statusResponse.data.result?.videoUrl;
        if (!videoUrl) {
          throw new Error('Video generation completed but no video URL found');
        }

        // Download video and upload to R2
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error('Failed to download generated video');
        }

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const r2Result = await r2StorageService.uploadAsset(
          videoBuffer,
          `workflow-video-${randomUUID()}.mp4`,
          'video/mp4',
          'video'
        );

        // Spend credits
        await creditService.spendCredits({
          userId,
          amount: creditCost,
          source: 'api_call',
          description: `Workflow video generation (${mode})`,
          metadata: {
            workflowId: 'workflow-id',
            mode,
            taskId,
          },
        });

        // Update quota
        const dailyPeriod = new Date().toISOString().split('T')[0];
        await updateQuotaUsage({
          userId,
          service: 'video_generation',
          amount: 1,
          period: dailyPeriod,
        });

        return {
          id: randomUUID(),
          url: r2Result.url,
          prompt,
          type: 'video',
          creditsSpent: creditCost,
        };
      }

      if (status === 'failed') {
        throw new Error(statusResponse.data.error || 'Video generation failed');
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Video generation timeout');
      }
    }

    throw new Error('Unexpected video generation status');
  }

  /**
   * Package assets into ZIP and upload to R2
   */
  private async packageAssets(
    assets: WorkflowResult['generatedAssets'],
    workflowId: string
  ): Promise<string> {
    // Download all assets
    const files: Array<{ name: string; data: Buffer }> = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        const response = await fetch(asset.url);
        const buffer = await response.arrayBuffer();
        const extension = asset.type === 'image' ? 'png' : 'mp4';
        files.push({
          name: `asset-${i + 1}.${extension}`,
          data: Buffer.from(buffer),
        });
      } catch (error) {
        console.error(`Failed to download asset ${i + 1}:`, error);
      }
    }

    if (files.length === 0) {
      throw new Error('No assets to package');
    }

    // Create ZIP file using JSZip
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add all files to ZIP
      for (const file of files) {
        zip.file(file.name, file.data);
      }

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      // Upload ZIP to R2
      const { r2StorageService } = await import('@/lib/storage/r2');
      const { key, url } = await r2StorageService.uploadFile(
        zipBuffer,
        `workflow-${workflowId}.zip`,
        'application/zip',
        'workflow-exports'
      );

      return url;
    } catch (error) {
      console.error('ZIP creation error:', error);
      // Fallback: return first asset URL
      return assets[0]?.url || '';
    }
  }

  /**
   * Process CSV/Excel file for batch generation with publishing
   */
  async processBatchFile(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    options?: {
      generationType?: 'image' | 'video';
      mode?: 't2i' | 'i2i' | 't2v' | 'i2v';
      aspectRatio?: string;
      style?: string;
      columnMapping?: Record<string, string>;
      autoPublish?: boolean; // Whether to auto-publish after generation
      jobId?: string; // Batch job ID for linking assets
    }
  ): Promise<{
    jobId: string;
    results: Array<{
      assetId: string;
      assetUrl: string;
      assetType: 'image' | 'video';
      prompt: string;
      enhancedPrompt?: string;
      model?: string;
      status: 'completed' | 'failed';
      error?: string;
      publishResults?: any[];
    }>;
  }> {
    // Parse CSV/Excel using template generator
    const { templateGenerator } = await import('./template-generator');
    const rows = templateGenerator.parseTemplateFile(fileBuffer, fileName);

    // Process each row
    const results: Array<{ assetId: string; publishResults?: any[] }> = [];

    for (const row of rows) {
      try {
        // Determine generation type and mode from options (set by frontend)
        // If not provided in options, infer from row data (backward compatibility)
        const generationType: 'image' | 'video' =
          options?.generationType ||
          (row.generationMode?.startsWith('t2v') || row.generationMode?.startsWith('i2v')
            ? 'video'
            : 'image');

        // Determine mode: use options first, then row data, then default
        let mode: 't2i' | 'i2i' | 't2v' | 'i2v';
        if (options?.mode) {
          mode = options.mode;
        } else if (row.generationMode) {
          mode = row.generationMode;
        } else {
          // Default based on generation type and baseImageUrl
          if (generationType === 'image') {
            mode = row.baseImageUrl ? 'i2i' : 't2i';
          } else {
            mode = row.baseImageUrl ? 'i2v' : 't2v';
          }
        }

        // Enhance prompt (no brand analysis since companyUrl is removed)
        let enhancedPrompt = await this.enhancePrompt(
          row.prompt,
          null, // No brand analysis
          row.baseImageUrl,
          0
        );

        // Add style enhancement to prompt if style is provided
        if (options?.style) {
          const { getImageStyle, getVideoStyle } = await import('@/config/styles.config');
          const styleConfig =
            generationType === 'image'
              ? getImageStyle(options.style)
              : getVideoStyle(options.style);
          if (styleConfig?.promptEnhancement) {
            enhancedPrompt = `${enhancedPrompt}, ${styleConfig.promptEnhancement}`;
          }
        }

        // Get aspect ratio from options (set by frontend) or use default
        const aspectRatio = options?.aspectRatio || row.aspectRatio || (generationType === 'image' ? '1:1' : '16:9');

        // Generate asset
        const asset = await this.generateAsset(
          userId,
          {
            prompt: enhancedPrompt,
            mode: mode as 't2i' | 'i2i' | 't2v' | 'i2v',
            type: generationType,
            baseImage: row.baseImageUrl,
            model: row.model || (generationType === 'image' ? 'nano-banana' : 'sora-2'),
            aspectRatio,
          },
          options?.jobId || 'batch-job'
        );

        // Save asset to database if jobId provided
        if (options?.jobId && asset.id) {
          try {
            const { db } = await import('@/server/db');
            const { generatedAsset } = await import('@/server/db/schema');

            // Extract R2 key from URL
            const r2Key = asset.url.split('/').pop() || '';

            await db
              .insert(generatedAsset)
              .values({
                id: asset.id,
                userId,
                batchJobId: options.jobId,
                assetType: generationType,
                generationMode: mode as 't2i' | 'i2i' | 't2v' | 'i2v',
                prompt: row.prompt,
                enhancedPrompt,
                r2Key,
                publicUrl: asset.url,
                status: 'completed',
                creditsSpent: asset.creditsSpent || 0,
                productName: row.productTitle,
                productDescription: row.productDescription,
              })
              .onConflictDoNothing();
          } catch (error) {
            console.error('Failed to save asset to database:', error);
          }
        }

        // Auto-publish if requested and publish info is available
        let publishResults: any[] | undefined;
        if ((options?.autoPublish || row.publishPlatforms) && row.publishPlatforms) {
          const platforms = row.publishPlatforms
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean) as any[];

          if (platforms.length > 0) {
            const { platformPublishingService } = await import('@/lib/publishing/platform-service');

            const publishRequests = platforms.map((platform) => ({
              assetId: asset.id,
              assetUrl: asset.url,
              assetType: generationType,
              platform,
              publishMode: row.publishMode || 'media-only',
              productInfo:
                row.publishMode === 'product'
                  ? {
                      title: row.productTitle,
                      description: row.productDescription,
                      category: row.productCategory,
                      brand: row.productBrand,
                      model: row.productModel,
                      sku: row.productSku,
                      upc: row.productUpc,
                      countryOfOrigin: row.productCountryOfOrigin,
                      standardPrice: row.standardPrice,
                      salePrice: row.salePrice,
                      currency: row.currency,
                      inventoryQuantity: row.inventoryQuantity,
                      minPurchaseQuantity: row.minPurchaseQuantity,
                      maxPurchaseQuantity: row.maxPurchaseQuantity,
                      tags: row.productTags
                        ?.split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }
                  : undefined,
            }));

            const publishResultsData =
              await platformPublishingService.publishToMultiplePlatforms(publishRequests);
            publishResults = publishResultsData;
          }
        }

        results.push({
          assetId: asset.id,
          assetUrl: asset.url,
          assetType: generationType,
          prompt: row.prompt,
          enhancedPrompt,
          model: row.model || 'nano-banana',
          status: 'completed',
          publishResults,
        });
      } catch (error) {
        console.error('Failed to process row:', error);
        // Add failed result
        results.push({
          assetId: '',
          assetUrl: '',
          assetType: generationType,
          prompt: row.prompt || '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { jobId: 'batch-job-id', results };
  }

  /**
   * Extract generation requirement from CSV row (legacy method, kept for compatibility)
   */
  private extractRequirementFromRow(
    row: Record<string, any>,
    columnMapping?: Record<string, string>
  ): string {
    if (columnMapping) {
      const parts: string[] = [];
      for (const [csvCol, field] of Object.entries(columnMapping)) {
        if (row[csvCol]) {
          parts.push(`${field}: ${row[csvCol]}`);
        }
      }
      return parts.join(', ');
    }

    // Default: use product name and description
    const productName = row.productName || row.name || row.product || '';
    const description = row.description || row.desc || '';
    return `${productName}${description ? ` - ${description}` : ''}`;
  }
}

export const workflowEngine = new WorkflowEngine();
