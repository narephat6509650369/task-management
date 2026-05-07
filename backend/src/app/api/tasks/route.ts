import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
});

// GET /api/tasks - Get all tasks for logged-in user
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(tasks);
    } catch (error) {
      console.error('[GET TASKS ERROR]', error);
      return errorResponse('Failed to fetch tasks', 500);
    }
  });
}

// POST /api/tasks - Create new task
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    try {
      const body = await req.json();

      const validation = createTaskSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message, 400);
      }

      const task = await prisma.task.create({
        data: {
          ...validation.data,
          userId: user.userId,
        },
      });

      return successResponse(task, 201);
    } catch (error) {
      console.error('[CREATE TASK ERROR]', error);
      return errorResponse('Failed to create task', 500);
    }
  });
}
