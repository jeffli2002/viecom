import {
  type ArkVideoApiError,
  ArkVideoApiService,
  getArkVideoTokenUsage,
  getArkVideoUrl,
} from '@/lib/volcengine/ark-video-api';

jest.mock('@/env', () => ({
  env: {
    ARK_API_KEY: 'ark-test-key',
    ARK_SEEDANCE_FAST_MODEL: 'doubao-seedance-2-0-fast-260128',
  },
}));

describe('ArkVideoApiService', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('creates a Seedance text-to-video task with explicit output settings', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'task-123', status: 'queued' }),
    });

    const service = new ArkVideoApiService();
    await expect(
      service.createVideoTask({
        prompt: 'A product rotating on a studio table',
        resolution: '720p',
        ratio: '16:9',
        duration: 10,
        safetyIdentifier: 'user-hash',
      })
    ).resolves.toMatchObject({ id: 'task-123' });

    const [url, requestInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(url).toBe('https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks');
    expect(requestInit.headers.Authorization).toBe('Bearer ark-test-key');
    expect(body).toMatchObject({
      model: 'doubao-seedance-2-0-fast-260128',
      resolution: '720p',
      ratio: '16:9',
      duration: 10,
      generate_audio: true,
      safety_identifier: 'user-hash',
    });
    expect(body.content).toEqual([{ type: 'text', text: 'A product rotating on a studio table' }]);
  });

  it('marks an image as the first frame for image-to-video', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'task-image', status: 'queued' }),
    });

    const service = new ArkVideoApiService();
    await service.createVideoTask({
      prompt: 'Bring the product to life',
      resolution: '480p',
      ratio: '9:16',
      duration: 15,
      imageUrl: 'https://cdn.example.com/product.png',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'https://cdn.example.com/product.png' },
      role: 'first_frame',
    });
  });

  it('can request a silent Seedance video', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'task-silent', status: 'queued' }),
    });

    await new ArkVideoApiService().createVideoTask({
      prompt: 'A silent product turntable shot',
      resolution: '480p',
      ratio: 'adaptive',
      duration: 10,
      generateAudio: false,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.generate_audio).toBe(false);
    expect(body.ratio).toBe('adaptive');
  });

  it('adds a reference video for multimodal Seedance generation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'task-reference-video', status: 'queued' }),
    });

    await new ArkVideoApiService().createVideoTask({
      prompt: 'Follow the camera movement from the reference video',
      resolution: '720p',
      ratio: 'adaptive',
      duration: 10,
      videoUrl: 'https://cdn.example.com/reference.mp4',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.content[1]).toEqual({
      type: 'video_url',
      video_url: { url: 'https://cdn.example.com/reference.mp4' },
      role: 'reference_video',
    });
  });

  it('queries task status and extracts the generated video URL', async () => {
    const response = {
      id: 'task-123',
      status: 'succeeded',
      content: { video_url: 'https://cdn.example.com/video.mp4' },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(response),
    });

    const task = await new ArkVideoApiService().getVideoTask('task-123');
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/task-123'
    );
    expect(getArkVideoUrl(task)).toBe('https://cdn.example.com/video.mp4');
  });

  it('extracts billed token usage from a completed task', () => {
    expect(
      getArkVideoTokenUsage({
        id: 'task-usage',
        status: 'succeeded',
        usage: { total_tokens: 432000, completion_tokens: 432000 },
      })
    ).toBe(432000);
  });

  it('surfaces Ark error messages', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
    });

    await expect(
      new ArkVideoApiService().createVideoTask({
        prompt: 'test',
        resolution: '720p',
        ratio: '16:9',
        duration: 10,
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<ArkVideoApiError>>({
        name: 'ArkVideoApiError',
        message: 'Rate limit exceeded',
        status: 429,
      })
    );
  });
});
