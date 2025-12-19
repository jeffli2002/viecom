import { randomUUID } from 'node:crypto';
import { db } from '@/server/db';
import { generationLock } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';

type AssetType = 'image' | 'video';

export interface GenerationLockInfo {
  id: string;
  requestId: string | null;
  taskId: string | null;
  expiresAt: Date;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
}

interface AcquireGenerationLockParams {
  userId: string;
  assetType: AssetType;
  requestId?: string;
  metadata?: Record<string, unknown>;
  ttlMs?: number;
}

interface AcquireGenerationLockResult {
  acquired: boolean;
  lockId?: string;
  expiresAt?: Date;
  existingLock?: GenerationLockInfo;
}

const DEFAULT_LOCK_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Acquire a generation lock for a user/asset type combination.
 * Ensures only one in-flight generation per user to prevent duplicate submissions.
 */
export async function acquireGenerationLock(
  params: AcquireGenerationLockParams
): Promise<AcquireGenerationLockResult> {
  const now = Date.now();
  const ttlMs = params.ttlMs ?? DEFAULT_LOCK_TTL_MS;
  const expiresAt = new Date(now + ttlMs);
  const lockId = randomUUID();

  const inserted = await db
    .insert(generationLock)
    .values({
      id: lockId,
      userId: params.userId,
      assetType: params.assetType,
      requestId: params.requestId ?? null,
      metadata: (params.metadata ?? null) as Record<string, unknown> | null,
      expiresAt,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [generationLock.userId, generationLock.assetType],
    })
    .returning({ id: generationLock.id });

  if (inserted.length > 0) {
    return { acquired: true, lockId, expiresAt };
  }

  const existing = await db
    .select({
      id: generationLock.id,
      requestId: generationLock.requestId,
      taskId: generationLock.taskId,
      expiresAt: generationLock.expiresAt,
      createdAt: generationLock.createdAt,
      metadata: generationLock.metadata,
    })
    .from(generationLock)
    .where(
      and(eq(generationLock.userId, params.userId), eq(generationLock.assetType, params.assetType))
    )
    .limit(1);

  const activeLock = existing[0];

  if (activeLock?.expiresAt && activeLock.expiresAt.getTime() <= now) {
    // Expired lock - remove and retry acquisition once
    await db.delete(generationLock).where(eq(generationLock.id, activeLock.id));
    return acquireGenerationLock(params);
  }

  return {
    acquired: false,
    existingLock: activeLock
      ? {
          id: activeLock.id,
          requestId: activeLock.requestId,
          taskId: activeLock.taskId,
          expiresAt: activeLock.expiresAt,
          createdAt: activeLock.createdAt,
          metadata: (activeLock.metadata ?? null) as Record<string, unknown> | null,
        }
      : undefined,
  };
}

interface UpdateGenerationLockParams {
  taskId?: string;
  metadata?: Record<string, unknown>;
  extendMs?: number;
}

/**
 * Update lock metadata (e.g., attach external task id or extend TTL)
 */
export async function updateGenerationLock(
  lockId: string,
  params: UpdateGenerationLockParams
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (params.taskId) {
    updatePayload.taskId = params.taskId;
  }

  if (params.metadata) {
    updatePayload.metadata = params.metadata as Record<string, unknown>;
  }

  if (params.extendMs && params.extendMs > 0) {
    updatePayload.expiresAt = new Date(Date.now() + params.extendMs);
  }

  await db.update(generationLock).set(updatePayload).where(eq(generationLock.id, lockId));
}

/**
 * Release a generation lock once processing completes or fails.
 */
export async function releaseGenerationLock(lockId: string): Promise<void> {
  await db.delete(generationLock).where(eq(generationLock.id, lockId));
}
