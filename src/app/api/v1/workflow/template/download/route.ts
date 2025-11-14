import { templateGenerator } from '@/lib/workflow/template-generator';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // 'excel' or 'csv'
    const generationType = (searchParams.get('generationType') as 'image' | 'video') || 'image';

    if (format === 'csv') {
      const csv = templateGenerator.generateCSVTemplate(generationType);
      const filename = `batch-${generationType}-generation-template.csv`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Excel format
    const buffer = templateGenerator.generateExcelTemplate(generationType);
    const filename = `batch-${generationType}-generation-template.xlsx`;
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate template',
      },
      { status: 500 }
    );
  }
}
