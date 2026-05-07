import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/middleware';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Sign JWT
    const token = await signToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return errorResponse('Internal server error', 500);
  }
}
