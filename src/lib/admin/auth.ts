import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production';

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function verifyAdminToken(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin') {
      return null;
    }

    return payload as AdminTokenPayload;
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminTokenPayload> {
  const admin = await verifyAdminToken();

  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return admin;
}
