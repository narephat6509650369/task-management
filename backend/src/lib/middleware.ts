import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);

    return await handler(req, user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }
}

export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
