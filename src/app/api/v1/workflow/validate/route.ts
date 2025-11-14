import { templateGenerator } from '@/lib/workflow/template-generator';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  totalRows: number;
  errors: ValidationError[];
  rows: Array<Record<string, unknown>>;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const _generationType = (formData.get('generationType') as 'image' | 'video') || 'image';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse file
    const rows = templateGenerator.parseTemplateFile(fileBuffer, file.name);
    const errors: ValidationError[] = [];
    const validatedRows: Array<Record<string, unknown>> = [];

    // Validate each row
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because row 1 is header, index starts at 0
      const rowErrors: ValidationError[] = [];

      // Required field: prompt
      if (!row.prompt || !row.prompt.trim()) {
        rowErrors.push({
          row: rowNumber,
          field: 'prompt',
          message: 'Prompt字段是必需的，不能为空',
        });
      }

      // Validate baseImageUrl if provided
      // Can be HTTP/HTTPS URL or base64 image data URL
      if (row.baseImageUrl?.trim()) {
        const url = row.baseImageUrl.trim();
        const isValidUrl =
          url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
        if (!isValidUrl) {
          rowErrors.push({
            row: rowNumber,
            field: 'baseImageUrl',
            message: 'baseImageUrl必须是有效的HTTP/HTTPS URL或base64图片（data:image/...）',
          });
        }
      }

      // Validate aspectRatio if provided
      if (row.aspectRatio?.trim()) {
        const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        if (!validRatios.includes(row.aspectRatio.trim())) {
          rowErrors.push({
            row: rowNumber,
            field: 'aspectRatio',
            message: `AspectRatio必须是以下之一: ${validRatios.join(', ')}`,
          });
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validatedRows.push({
          ...row,
          _rowNumber: rowNumber,
        });
      }
    });

    const result: ValidationResult = {
      valid: errors.length === 0,
      totalRows: rows.length,
      errors,
      rows: validatedRows,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('File validation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to validate file',
      },
      { status: 500 }
    );
  }
}
