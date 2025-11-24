import { env } from '@/env';

const buildModelPriorityList = (...models: Array<string | undefined>): string[] => {
  return models.filter(
    (model, index, arr): model is string =>
      typeof model === 'string' && model.length > 0 && arr.indexOf(model) === index
  );
};

const IMAGE_MODEL_PRIORITY = {
  t2i: buildModelPriorityList(
    env.KIE_IMAGE_T2I_MODEL,
    'google/nano-banana', // Text-to-image model
    'nano-banana-pro' // Nano Banana Pro model
  ),
  i2i: buildModelPriorityList(
    env.KIE_IMAGE_I2I_MODEL,
    'google/nano-banana-edit', // Image-to-image model
    'nano-banana-pro' // Nano Banana Pro model (supports both T2I and I2I)
  ),
};

export interface KIEImageGenerationParams {
  prompt: string;
  imageSize?:
    | '1:1'
    | '9:16'
    | '16:9'
    | '3:4'
    | '4:3'
    | '3:2'
    | '2:3'
    | '5:4'
    | '4:5'
    | '21:9'
    | 'auto';
  outputFormat?: 'png' | 'jpeg';
  imageUrl?: string; // For I2I - single image URL (will be converted to image_urls array)
  imageUrls?: string[]; // For I2I - array of image URLs (up to 10 images)
  callBackUrl?: string; // Optional callback URL for task completion notifications
}

export interface KIEVideoGenerationParams {
  prompt: string;
  imageUrls?: string[]; // For I2V
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  quality?: 'standard' | 'high'; // standard=720P, high=1080P
  duration?: 10 | 15; // 视频时长（秒）
  model?: 'sora-2' | 'sora-2-pro'; // 模型选择
}

export interface KIETaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface KIETaskStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: 'success' | 'fail' | 'pending' | 'processing'; // KIE API uses 'state' and 'success'/'fail'
    status?: 'pending' | 'processing' | 'completed' | 'failed'; // Legacy support
    resultJson?: string; // JSON string containing resultUrls
    result?: {
      videoUrl?: string;
      imageUrl?: string;
      resultUrls?: string[]; // Array of image URLs
    };
    error?: string;
    failMsg?: string;
  };
}

type KIEImageTaskInput = {
  prompt: string;
  image_urls?: string[];
  image_size?: KIEImageGenerationParams['imageSize'];
  output_format?: KIEImageGenerationParams['outputFormat'];
};

type KIEImageTaskRequest = {
  model: string;
  input: KIEImageTaskInput;
  callBackUrl?: string;
};

type KIEVideoTaskInput = {
  prompt: string;
  aspect_ratio: 'square' | 'portrait' | 'landscape';
  size?: 'standard' | 'high';
  n_frames?: '10' | '15';
  image_urls?: string[];
};

export class KIEAPIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.kie.ai/api/v1';
  private readonly imageModelPriority = IMAGE_MODEL_PRIORITY;

  private getApiKey(): string {
    if (!this.apiKey) {
      if (!env.KIE_API_KEY) {
        throw new Error('KIE_API_KEY is not configured');
      }
      this.apiKey = env.KIE_API_KEY;
    }
    return this.apiKey;
  }

  /**
   * Generate image using nano banana model
   */
  async generateImage(
    params: KIEImageGenerationParams,
    preferredModel?: string
  ): Promise<KIETaskResponse> {
    // Determine if this is I2I or T2I based on imageUrl
    const isI2I = !!params.imageUrl || (params.imageUrls && params.imageUrls.length > 0);
    let priorityList = isI2I ? this.imageModelPriority.i2i : this.imageModelPriority.t2i;

    // If a preferred model is specified, prioritize it
    // Map 'nano-banana-pro' to 'nano-banana-pro' (same name in KIE API)
    if (preferredModel) {
      // Check if preferred model exists in priority list (exact match or mapped name)
      const modelInList = priorityList.find(
        (m) => m === preferredModel || m.includes(preferredModel)
      );
      if (modelInList) {
        priorityList = [modelInList, ...priorityList.filter((m) => m !== modelInList)];
      } else if (preferredModel === 'nano-banana-pro') {
        // If nano-banana-pro is requested but not in list, add it to the front
        priorityList = [preferredModel, ...priorityList];
      }
    }

    if (priorityList.length === 0) {
      throw new Error(
        `No KIE image models configured for ${isI2I ? 'image-to-image' : 'text-to-image'}`
      );
    }

    // For I2I, image_urls is required
    if (isI2I && !params.imageUrl) {
      throw new Error('Image URL is required for image-to-image generation');
    }

    let lastError: Error | null = null;
    const attemptedModels: string[] = [];

    for (const modelName of priorityList) {
      attemptedModels.push(modelName);
      try {
        console.log(
          `Attempting to create ${isI2I ? 'image-to-image' : 'text-to-image'} task with model: ${modelName}`
        );
        return await this.createImageTask(modelName, params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Model ${model} failed:`, lastError.message);

        // If this is not a retryable error, or it's the last model, throw immediately
        if (
          !this.shouldRetryWithNextModel(lastError) ||
          model === priorityList[priorityList.length - 1]
        ) {
          break;
        }

        // Otherwise, try next model
        console.log('Retrying with next model in priority list...');
      }
    }

    const errorMessage = lastError
      ? `All models failed. Attempted: ${attemptedModels.join(', ')}. Last error: ${lastError.message}`
      : 'Failed to create image generation task';

    throw new Error(errorMessage);
  }

  private async createImageTask(
    model: string,
    params: KIEImageGenerationParams
  ): Promise<KIETaskResponse> {
    // Map model name to KIE API model name
    // KIE API uses 'nano-banana-pro' for the pro model
    // For other models, use as-is (e.g., 'google/nano-banana', 'google/nano-banana-edit')
    let kieModelName: string;
    if (model === 'nano-banana-pro') {
      kieModelName = 'nano-banana-pro';
    } else if (model === 'google/nano-banana' || model === 'google/nano-banana-edit') {
      kieModelName = model; // Use full model name for standard nano-banana
    } else {
      kieModelName = model; // Fallback to original model name
    }

    // KIE API format according to documentation
    const input: KIEImageTaskInput = {
      prompt: params.prompt,
    };

    // For I2I (google/nano-banana-edit), image_urls is required
    // Support both imageUrl (single) and imageUrls (array) for flexibility
    if (params.imageUrls && params.imageUrls.length > 0) {
      input.image_urls = params.imageUrls.slice(0, 10); // Max 10 images
    } else if (params.imageUrl) {
      input.image_urls = [params.imageUrl]; // Convert single URL to array
    }

    // Add optional parameters
    if (params.imageSize) {
      input.image_size = params.imageSize;
    }
    if (params.outputFormat) {
      input.output_format = params.outputFormat;
    }

    // Build request body
    const requestBody: KIEImageTaskRequest = {
      model: kieModelName,
      input,
    };

    // Add optional callback URL
    if (params.callBackUrl) {
      requestBody.callBackUrl = params.callBackUrl;
    }

    const response = await fetch(`${this.baseUrl}/jobs/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    if (!response.ok || !responseText) {
      const errorMsg = responseText || response.statusText;
      console.error(`KIE API error (${model}):`, {
        status: response.status,
        statusText: response.statusText,
        responseText: errorMsg.substring(0, 500),
      });
      throw new Error(`KIE API error (${model}): ${errorMsg}`);
    }

    let data: KIETaskResponse;
    try {
      data = JSON.parse(responseText) as KIETaskResponse;
    } catch (_error) {
      console.error(`KIE API parse error (${model}):`, responseText.substring(0, 500));
      throw new Error(`KIE API parse error (${model}): ${(responseText || '').slice(0, 200)}`);
    }

    if (data.code !== 200) {
      const errorMsg = data.msg || `Failed to create image generation task (${model})`;
      console.error(`KIE API task creation failed (${model}):`, {
        code: data.code,
        msg: errorMsg,
      });
      throw new Error(errorMsg);
    }

    return data;
  }

  private shouldRetryWithNextModel(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('does not exist') ||
      message.includes('not published') ||
      message.includes('not exist')
    );
  }

  /**
   * Generate video using sora 2 or sora 2 pro model
   */
  async generateVideo(params: KIEVideoGenerationParams): Promise<KIETaskResponse> {
    // 确定使用的模型
    const useProModel = params.model === 'sora-2-pro' || params.quality === 'high';
    const hasImage = params.imageUrls?.length;

    let model: string;
    if (useProModel) {
      // Sora 2 Pro 支持720P和1080P
      model = hasImage ? 'sora-2-pro-image-to-video' : 'sora-2-pro-text-to-video';
    } else {
      // Sora 2 仅支持720P
      model = hasImage ? 'sora-2-image-to-video' : 'sora-2-text-to-video';
    }

    // 构建输入参数
    const requestedSize = params.quality === 'high' ? 'high' : 'standard';
    const input: KIEVideoTaskInput = {
      prompt: params.prompt,
      aspect_ratio: params.aspectRatio || 'landscape',
      size: requestedSize,
    };

    // Sora 2 Pro 支持 quality 和 n_frames 参数
    if (useProModel) {
      // 根据 duration 设置 n_frames
      input.n_frames = params.duration === 10 ? '10' : '15';
    }

    // 添加图片URL（如果有）
    if (hasImage) {
      input.image_urls = params.imageUrls;
    }

    const response = await fetch(`${this.baseUrl}/jobs/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    const responseText = await response.text();
    if (!response.ok || !responseText) {
      throw new Error(`KIE API error: ${responseText || response.statusText}`);
    }

    const data = JSON.parse(responseText) as KIETaskResponse;
    if (data.code !== 200) {
      throw new Error(data.msg || 'Failed to create video generation task');
    }

    return data;
  }

  /**
   * Check task status
   */
  async getTaskStatus(taskId: string): Promise<KIETaskStatus> {
    const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
      },
    });

    const responseText = await response.text();
    if (!response.ok || !responseText) {
      console.error(`[KIE API] getTaskStatus failed for task ${taskId}:`, {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500),
      });
      throw new Error(`KIE API error: ${responseText || response.statusText}`);
    }

    let data: KIETaskStatus;
    try {
      data = JSON.parse(responseText) as KIETaskStatus;
    } catch (parseError) {
      console.error(`[KIE API] Failed to parse response for task ${taskId}:`, {
        responseText: responseText.substring(0, 500),
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error(
        `KIE API response parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // Parse resultJson if present (for image generation)
    if (data.data?.resultJson) {
      try {
        const resultData = JSON.parse(data.data.resultJson);
        if (resultData.resultUrls && Array.isArray(resultData.resultUrls)) {
          data.data.result = {
            ...data.data.result,
            resultUrls: resultData.resultUrls,
            imageUrl: resultData.resultUrls[0], // Use first URL as imageUrl for compatibility
          };
        }
      } catch (e) {
        console.warn('Failed to parse resultJson:', e);
      }
    }

    // Map 'state' to 'status' for compatibility
    if (data.data?.state && !data.data.status) {
      data.data.status =
        data.data.state === 'success'
          ? 'completed'
          : data.data.state === 'fail'
            ? 'failed'
            : data.data.state === 'pending'
              ? 'pending'
              : 'processing';
    }

    return data;
  }

  /**
   * Poll task status until completion or failure
   */
  async pollTaskStatus(
    taskId: string,
    type: 'image' | 'video',
    maxAttempts = 60,
    intervalMs = 3000
  ): Promise<{ imageUrl?: string; videoUrl?: string; status: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTaskStatus(taskId);

      if (status.data?.status === 'completed' || status.data?.state === 'success') {
        if (type === 'image') {
          const imageUrl =
            status.data?.result?.imageUrl ||
            status.data?.result?.resultUrls?.[0] ||
            status.data?.resultJson
              ? JSON.parse(status.data.resultJson).resultUrls?.[0]
              : undefined;

          if (imageUrl) {
            return { imageUrl, status: 'completed' };
          }
        } else {
          const videoUrl = status.data?.result?.videoUrl || status.data?.result?.resultUrls?.[0];
          if (videoUrl) {
            return { videoUrl, status: 'completed' };
          }
        }
      }

      if (status.data?.status === 'failed' || status.data?.state === 'fail') {
        throw new Error(status.data?.error || 'Task failed');
      }

      // Wait before next poll
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Task polling timeout');
  }
}

// Lazy initialization - create instance on first use
let _kieApiService: KIEAPIService | null = null;

export function getKieApiService(): KIEAPIService {
  if (!_kieApiService) {
    _kieApiService = new KIEAPIService();
  }
  return _kieApiService;
}

// Don't export a singleton instance - use getKieApiService() instead
// This prevents module-level initialization errors
