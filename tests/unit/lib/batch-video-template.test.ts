import { templateGenerator } from '@/lib/workflow/template-generator';

describe('batch video template', () => {
  it('includes and parses reference video billing fields', async () => {
    const csv = templateGenerator.generateCSVTemplate('video');

    expect(csv.split('\n')[0]).toContain('referenceVideoUrl,referenceVideoDuration');

    const rows = await templateGenerator.parseTemplateFile(
      Buffer.from(csv),
      'batch-video-template.csv'
    );
    expect(rows[1]).toMatchObject({
      referenceVideoUrl: 'https://example.com/reference-video.mp4',
      referenceVideoDuration: 10,
    });
  });
});
