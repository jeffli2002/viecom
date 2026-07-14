import { env } from '@/env';

const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

export type ArkVideoResolution = '480p' | '720p';
export type ArkVideoDuration = 10 | 15;

export interface ArkVideoGenerationParams {
  prompt: string;
  resolution: ArkVideoResolution;
  ratio: string;
  duration: ArkVideoDuration;
  imageUrl?: string;
  safetyIdentifier?: string;
}

export interface ArkVideoTask {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'expired' | 'canceled' | string;
  content?: unknown;
  error?: unknown;
}

export class ArkVideoApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ArkVideoApiError';
  }
}

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const errorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'object' && payload !== null) {
    const value = payload as Record<string, unknown>;
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;
    if (typeof value.error === 'object' && value.error !== null) {
      const error = value.error as Record<string, unknown>;
      if (typeof error.message === 'string') return error.message;
    }
    if (typeof value.code === 'string') return `${value.code}: ${fallback}`;
  }
  return fallback;
};

export const getArkVideoUrl = (task: ArkVideoTask): string | undefined => {
  const content = task.content;
  if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
    const value = content as Record<string, unknown>;
    const videoUrl = value.video_url;
    if (typeof videoUrl === 'string') return videoUrl;
    if (typeof videoUrl === 'object' && videoUrl !== null && typeof videoUrl.url === 'string') {
      return videoUrl.url;
    }
  }

  if (Array.isArray(content)) {
    for (const item of content) {
      if (typeof item !== 'object' || item === null) continue;
      const value = item as Record<string, unknown>;
      const videoUrl = value.video_url;
      if (typeof videoUrl === 'string') return videoUrl;
      if (typeof videoUrl === 'object' && videoUrl !== null && typeof videoUrl.url === 'string') {
        return videoUrl.url;
      }
    }
  }

  return undefined;
};

export class ArkVideoApiService {
  private get apiKey() {
    if (!env.ARK_API_KEY) {
      throw new ArkVideoApiError('ARK_API_KEY is not configured');
    }
    return env.ARK_API_KEY;
  }

  private get model() {
    return env.ARK_SEEDANCE_FAST_MODEL || 'doubao-seedance-2-0-fast-260128';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createVideoTask(params: ArkVideoGenerationParams): Promise<ArkVideoTask> {
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: params.prompt }];

    if (params.imageUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: params.imageUrl },
        role: 'first_frame',
      });
    }

    const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: this.model,
        content,
        resolution: params.resolution,
        ratio: params.ratio,
        duration: params.duration,
        generate_audio: true,
        execution_expires_after: 3600,
        ...(params.safetyIdentifier ? { safety_identifier: params.safetyIdentifier } : {}),
      }),
    });
    const payload = await readJson(response);

    if (!response.ok || typeof payload !== 'object' || payload === null || !('id' in payload)) {
      throw new ArkVideoApiError(
        errorMessage(payload, `Ark video task creation failed (${response.status})`),
        response.status,
        payload
      );
    }

    return payload as ArkVideoTask;
  }

  async getVideoTask(taskId: string): Promise<ArkVideoTask> {
    const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks/${taskId}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    const payload = await readJson(response);

    if (!response.ok || typeof payload !== 'object' || payload === null) {
      throw new ArkVideoApiError(
        errorMessage(payload, `Ark video task query failed (${response.status})`),
        response.status,
        payload
      );
    }

    return payload as ArkVideoTask;
  }
}

let arkVideoApiService: ArkVideoApiService | null = null;

export const getArkVideoApiService = () => {
  if (!arkVideoApiService) {
    arkVideoApiService = new ArkVideoApiService();
  }
  return arkVideoApiService;
};
