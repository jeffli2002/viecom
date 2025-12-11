import { db } from '@/server/db';
import { user } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user email and name by user ID
 */
export async function getUserInfo(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const [userRecord] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (!userRecord) {
      return null;
    }

    return {
      email: userRecord.email,
      name: userRecord.name || 'User',
    };
  } catch (error) {
    console.error('[Email Helper] Failed to get user info:', error);
    return null;
  }
}
