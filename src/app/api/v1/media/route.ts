import { NextRequest, NextResponse } from 'next/server';
import { r2StorageService } from '@/lib/storage/r2';
import { Readable } from 'node:stream';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const shouldDownload = searchParams.get('download') === '1';

  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  try {
    const asset = await r2StorageService.getAsset(key);
    const body = asset.body;

    if (!body) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const stream =
      body instanceof Readable ? Readable.toWeb(body) : (body as ReadableStream<Uint8Array>);

    const headers: Record<string, string> = {
      'Content-Type': asset.contentType ?? 'application/octet-stream',
      'Cache-Control': asset.cacheControl ?? 'public, max-age=31536000, immutable',
    };

    if (asset.contentLength) {
      headers['Content-Length'] = asset.contentLength.toString();
    }
    if (asset.etag) {
      headers.ETag = asset.etag;
    }
    if (asset.lastModified) {
      headers['Last-Modified'] = asset.lastModified.toUTCString();
    }
    if (shouldDownload) {
      const filename = key.split('/').pop() || 'asset';
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      headers['Cache-Control'] = 'private, max-age=0';
    }

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Failed to retrieve asset from R2:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

