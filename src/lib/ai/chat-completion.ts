import { env } from '@/env';

const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_CHAT_COMPLETIONS_URL = 'https://api.deepseek.com/v1/chat/completions';
const OPENROUTER_MODEL = 'stealth/ox-alpha';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_TIMEOUT_MS = 15_000;

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatCompletionMessage[];
  temperature?: number;
  timeoutMs?: number;
};

export type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type AiProvider = {
  name: 'OpenRouter' | 'DeepSeek';
  apiKey: string;
  endpoint: string;
  model: string;
  headers: Record<string, string>;
};

const getProviders = (): AiProvider[] => {
  const providers: AiProvider[] = [];

  if (env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'OpenRouter',
      apiKey: env.OPENROUTER_API_KEY,
      endpoint: OPENROUTER_CHAT_COMPLETIONS_URL,
      model: OPENROUTER_MODEL,
      headers: {
        'HTTP-Referer': env.NEXT_PUBLIC_APP_URL,
        'X-Title': 'Viecom',
      },
    });
  }

  if (env.DEEPSEEK_API_KEY) {
    providers.push({
      name: 'DeepSeek',
      apiKey: env.DEEPSEEK_API_KEY,
      endpoint: DEEPSEEK_CHAT_COMPLETIONS_URL,
      model: DEEPSEEK_MODEL,
      headers: {},
    });
  }

  return providers;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const hasAssistantContent = (data: ChatCompletionResponse): boolean => {
  const content = data.choices?.[0]?.message?.content;
  return Boolean(content?.trim());
};

/**
 * Call OpenRouter first and fall back to DeepSeek when the primary provider
 * is unavailable, returns an error, or returns an unusable completion.
 */
export async function createChatCompletionWithFallback(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error('No AI provider API key configured');
  }

  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: Error | undefined;

  for (const provider of providers) {
    try {
      const response = await fetchWithTimeout(
        provider.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.headers,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: request.messages,
            temperature: request.temperature,
          }),
        },
        timeoutMs
      );

      if (!response.ok) {
        lastError = new Error(`${provider.name} returned HTTP ${response.status}`);
        console.warn(`[AI] ${provider.name} request failed; trying the next provider if available`);
        continue;
      }

      const data = (await response.json()) as ChatCompletionResponse;
      if (!hasAssistantContent(data)) {
        lastError = new Error(`${provider.name} returned no usable completion`);
        console.warn(
          `[AI] ${provider.name} returned no usable completion; trying the next provider`
        );
        continue;
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`${provider.name} request failed`);
      console.warn(`[AI] ${provider.name} request failed; trying the next provider if available`);
    }
  }

  throw lastError ?? new Error('All AI providers failed');
}
