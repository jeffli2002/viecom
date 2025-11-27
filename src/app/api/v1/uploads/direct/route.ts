import { Buffer } from 'node:buffer';
import {
  ALLOWED_SOURCE_IMAGE_MIME_TYPES,
  MAX_SOURCE_IMAGE_FILE_SIZE_BYTES,
  SOURCE_IMAGE_UPLOAD_FOLDER,
} from '@/config/image-upload.config';
import { auth } from '@/lib/auth/auth';
import { r2StorageService } from '@/lib/storage/r2';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const blob = formData.get('file');
    const fileNameRaw = formData.get('fileName');
    const declaredContentType = formData.get('contentType');
    const purpose = (formData.get('purpose') as string) || 'image-source';

    if (!(blob instanceof Blob)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const fileName =
      typeof fileNameRaw === 'string' && fileNameRaw.trim().length > 0
        ? fileNameRaw.trim()
        : 'upload';
    const contentType =
      typeof declaredContentType === 'string' && declaredContentType.length > 0
        ? declaredContentType
        : blob.type || 'application/octet-stream';

    if (!ALLOWED_SOURCE_IMAGE_MIME_TYPES.includes(contentType as (typeof ALLOWED_SOURCE_IMAGE_MIME_TYPES)[number])) {
      return NextResponse.json(
        { error: `Unsupported file type ${contentType}. Only JPEG, PNG, or WebP are allowed.` },
        { status: 400 }
      );
    }

    if (blob.size <= 0 || blob.size > MAX_SOURCE_IMAGE_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size must be between 1 byte and ${MAX_SOURCE_IMAGE_FILE_SIZE_BYTES} bytes.` },
        { status: 400 }
      );
    }

    if (purpose !== 'image-source') {
      return NextResponse.json({ error: 'Unsupported upload purpose' }, { status: 400 });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await r2StorageService.uploadFile(
      buffer,
      fileName,
      contentType,
      SOURCE_IMAGE_UPLOAD_FOLDER
    );

    return NextResponse.json({
      publicUrl: uploadResult.url,
      key: uploadResult.key,
      size: blob.size,
      contentType,
    });
  } catch (error) {
    console.error('Direct upload proxy failed:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again later.' },
      { status: 500 }
    );
  }
}
