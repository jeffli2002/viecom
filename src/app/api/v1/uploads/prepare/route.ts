import {
  MAX_SOURCE_IMAGE_FILE_SIZE_BYTES,
  SOURCE_IMAGE_UPLOAD_FOLDER,
  SOURCE_IMAGE_UPLOAD_URL_TTL_SECONDS,
} from '@/config/image-upload.config';
import { auth } from '@/lib/auth/auth';
import { r2StorageService } from '@/lib/storage/r2';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type PrepareUploadRequest = {
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  purpose?: 'image-source' | 'video-source';
};

const SUPPORTED_PURPOSES: Record<string, { folder: string; allowedMimePrefixes: string[] }> = {
  'image-source': { folder: SOURCE_IMAGE_UPLOAD_FOLDER, allowedMimePrefixes: ['image/'] },
  'video-source': { folder: 'video-inputs', allowedMimePrefixes: ['video/'] },
};

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: PrepareUploadRequest;
    try {
      payload = (await request.json()) as PrepareUploadRequest;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { fileName, contentType, fileSize, purpose = 'image-source' } = payload ?? {};

    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    const uploadPurpose = SUPPORTED_PURPOSES[purpose] ?? SUPPORTED_PURPOSES['image-source'];
    if (!uploadPurpose.allowedMimePrefixes.some((prefix) => contentType.startsWith(prefix))) {
      return NextResponse.json(
        { error: `Unsupported content type for ${purpose}. Received ${contentType}` },
        { status: 400 }
      );
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
      folder: uploadPurpose.folder,
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
    console.error('Failed to prepare R2 upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to prepare upload. Please try again later.' },
      { status: 500 }
    );
  }
}
