import { auth } from '@/lib/auth/auth';
import { r2StorageService } from '@/lib/storage/r2';
import { templateGenerator } from '@/lib/workflow/template-generator';
import { db } from '@/server/db';
import { batchGenerationJob, generatedAsset } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';

    // Get batch job
    const [job] = await db
      .select()
      .from(batchGenerationJob)
      .where(eq(batchGenerationJob.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get original file from R2
    if (!job.csvFileKey) {
      return NextResponse.json({ error: 'Original file not found' }, { status: 404 });
    }

    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { S3Client } = await import('@aws-sdk/client-s3');
    const { env } = await import('@/env');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: job.csvFileKey,
      })
    );

    const fileBuffer = Buffer.from(await getObjectResponse.Body!.transformToByteArray());

    // Parse original file
    const originalRows = templateGenerator.parseTemplateFile(fileBuffer, 'template.xlsx');

    // Get generated assets for this job
    const generatedAssets = await db
      .select()
      .from(generatedAsset)
      .where(eq(generatedAsset.batchJobId, jobId));

    // Create a map of row index to asset
    const assetMap = new Map<number, typeof generatedAssets[0]>();
    generatedAssets.forEach((asset) => {
      const rowIndex = (asset.metadata as any)?.rowIndex;
      if (rowIndex) {
        assetMap.set(rowIndex, asset);
      }
    });

    // Add generated URLs to rows
    // Match assets by rowIndex from metadata
    const updatedRows = originalRows.map((row, index) => {
      const rowIndex = index + 1;
      const asset = assetMap.get(rowIndex);
      
      return {
        ...row,
        productName: row.productName || row.productTitle || '',
        productDescription: row.productDescription || '',
        enhancedPrompt: asset?.enhancedPrompt || '',
        generatedImageUrl: asset?.assetType === 'image' ? asset.publicUrl : '',
        generatedVideoUrl: asset?.assetType === 'video' ? asset.publicUrl : '',
        generatedAssetUrl: asset?.publicUrl || '',
      };
    });

    // Generate updated template with minimal fields + results
    if (format === 'csv') {
      // Generate CSV - minimal fields + results
      const headers = [
        'productName',
        'productDescription',
        'prompt',
        'baseImageUrl',
        'productSellingPoints',
        // Generated Results
        'enhancedPrompt',
        'generatedImageUrl',
        'generatedVideoUrl',
        'generatedAssetUrl',
      ];

      let csv = headers.join(',') + '\n';
      updatedRows.forEach((row) => {
        const values = headers.map((header) => {
          const value = (row as any)[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="batch-results-${jobId}.csv"`,
        },
      });
    } else {
      // Generate Excel - minimal fields + results
      const headers = [
        'productName',
        'productDescription',
        'prompt',
        'baseImageUrl',
        'productSellingPoints',
        'enhancedPrompt',
        'generatedImageUrl',
        'generatedVideoUrl',
        'generatedAssetUrl',
      ];

      const data = [
        headers,
        ...updatedRows.map((row) => headers.map((header) => (row as any)[header] || '')),
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // productName
        { wch: 50 }, // productDescription
        { wch: 50 }, // prompt
        { wch: 50 }, // baseImageUrl (longer for URLs/base64)
        { wch: 40 }, // productSellingPoints
        { wch: 50 }, // enhancedPrompt
        { wch: 50 }, // generatedImageUrl
        { wch: 50 }, // generatedVideoUrl
        { wch: 50 }, // generatedAssetUrl
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Results');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="batch-results-${jobId}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Download template error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate template',
      },
      { status: 500 }
    );
  }
}
