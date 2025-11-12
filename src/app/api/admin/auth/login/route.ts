import { db } from '@/server/db';
import { admins } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export async function POST(request: Request) {
  try {
    const { email, password, remember } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

    if (!admin || admin.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const adminUser = admin[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
      },
      JWT_SECRET,
      { expiresIn: remember ? '30d' : JWT_EXPIRES_IN }
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

