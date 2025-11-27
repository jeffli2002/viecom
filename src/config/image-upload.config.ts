export const MAX_SOURCE_IMAGES = 3;

export const ALLOWED_SOURCE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
] as const;

export const MAX_SOURCE_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const SOURCE_IMAGE_UPLOAD_FOLDER = 'image-inputs';

export const SOURCE_IMAGE_UPLOAD_URL_TTL_SECONDS = 15 * 60; // 15 minutes
