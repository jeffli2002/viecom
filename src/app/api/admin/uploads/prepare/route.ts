import {
  MAX_SOURCE_IMAGE_FILE_SIZE_BYTES,
  SOURCE_IMAGE_UPLOAD_FOLDER,
  SOURCE_IMAGE_UPLOAD_URL_TTL_SECONDS,
} from '@/config/image-upload.config';
import { requireAdmin } from '@/lib/admin/auth';
import { r2StorageService } from '@/lib/storage/r2';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const payload = await request.json();
    const { fileName, contentType, fileSize } = payload ?? {};

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    if (
      typeof fileSize !== 'number' ||
      Number.isNaN(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_SOURCE_IMAGE_FILE_SIZE_BYTES
    ) {
      return NextResponse.json(
        { error: `File exceeds the ${MAX_SOURCE_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` },
        { status: 400 }
      );
    }

    const normalizedName = fileName.split('/').pop()?.trim() || 'upload';
    const uploadTarget = await r2StorageService.createDirectUploadUrl(normalizedName, contentType, {
      folder: SOURCE_IMAGE_UPLOAD_FOLDER,
      expiresIn: SOURCE_IMAGE_UPLOAD_URL_TTL_SECONDS,
    });

    return NextResponse.json({
      uploadUrl: uploadTarget.uploadUrl,
      key: uploadTarget.key,
      publicUrl: uploadTarget.publicUrl,
      maxFileSize: MAX_SOURCE_IMAGE_FILE_SIZE_BYTES,
      contentType,
    });
  } catch (error) {
    console.error('Failed to prepare admin upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to prepare upload. Please try again later.' },
      { status: 500 }
    );
  }
}
