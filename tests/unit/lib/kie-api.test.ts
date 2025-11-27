import { KIEAPIService } from '@/lib/kie/kie-api';

jest.mock('@/env', () => {
  const mockEnv = {
    DATABASE_URL: 'https://example.com',
    NODE_ENV: 'test',
    DISABLE_AUTH: 'false',
    BETTER_AUTH_SECRET: 'secret',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    R2_BUCKET_NAME: 'bucket',
    R2_ACCESS_KEY_ID: 'access',
    R2_SECRET_ACCESS_KEY: 'secret',
    R2_ENDPOINT: 'https://example.com',
    R2_PUBLIC_URL: 'https://example.com/public',
    KIE_API_KEY: 'kie-key',
    KIE_IMAGE_T2I_MODEL: 'mock-t2i-model',
    KIE_IMAGE_I2I_MODEL: 'mock-i2i-model',
    NEXT_PUBLIC_APP_URL: 'https://app.example.com',
    NEXT_PUBLIC_DISABLE_AUTH: 'false',
    ADMIN_EMAILS: '',
    CRON_SECRET: 'cron',
  } as Record<string, string>;

  return { env: mockEnv };
});

describe('KIEAPIService.generateImage', () => {
  const mockFetch = jest.fn();
  const successResponse = {
    code: 200,
    msg: 'ok',
    data: { taskId: 'task-123' },
  };

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(successResponse),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('sends text-to-image payloads with the T2I model', async () => {
    const service = new KIEAPIService();
    await expect(service.generateImage({ prompt: 'hello world' })).resolves.toEqual(
      successResponse
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = mockFetch.mock.calls[0];
    const parsedBody = JSON.parse((requestInit?.body as string) ?? '{}');
    expect(parsedBody.model).toBe('mock-t2i-model');
    expect(parsedBody.input.prompt).toBe('hello world');
    expect(parsedBody.input.image_urls).toBeUndefined();
  });

  it('accepts imageUrls for image-to-image generation', async () => {
    const service = new KIEAPIService();
    const imageUrls = ['https://example.com/input.png'];
    await expect(
      service.generateImage({
        prompt: 'refine existing image',
        imageUrls,
      })
    ).resolves.toEqual(successResponse);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = mockFetch.mock.calls[0];
    const parsedBody = JSON.parse((requestInit?.body as string) ?? '{}');
    expect(parsedBody.model).toBe('mock-i2i-model');
    expect(parsedBody.input.image_urls).toEqual(imageUrls);
  });

  it('prioritizes the preferred model when provided', async () => {
    const service = new KIEAPIService();
    const preferredModel = 'nano-banana-pro';
    const imageUrl = 'https://example.com/inputA.png';
    await service.generateImage({ prompt: 'use preferred model', imageUrl }, preferredModel);

    const [, requestInit] = mockFetch.mock.calls[0];
    const parsedBody = JSON.parse((requestInit?.body as string) ?? '{}');
    expect(parsedBody.model).toBe(preferredModel);
    expect(parsedBody.input.image_urls).toEqual([imageUrl]);
  });
});
