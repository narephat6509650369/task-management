import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});

// PUT /api/tasks/:id - Update task
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (req, user: JWTPayload) => {
    try {
      const taskId = parseInt(params.id);
      if (isNaN(taskId)) return errorResponse('Invalid task ID', 400);

      // Check ownership
      const existing = await prisma.task.findFirst({
        where: { id: taskId, userId: user.userId },
      });
      if (!existing) return errorResponse('Task not found', 404);

      const body = await req.json();
      const validation = updateTaskSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message, 400);
      }

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: validation.data,
      });

      return successResponse(updated);
    } catch (error) {
      console.error('[UPDATE TASK ERROR]', error);
      return errorResponse('Failed to update task', 500);
    }
  });
}

// DELETE /api/tasks/:id - Delete task
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (req, user: JWTPayload) => {
    try {
      const taskId = parseInt(params.id);
      if (isNaN(taskId)) return errorResponse('Invalid task ID', 400);

      // Check ownership
      const existing = await prisma.task.findFirst({
        where: { id: taskId, userId: user.userId },
      });
      if (!existing) return errorResponse('Task not found', 404);

      await prisma.task.delete({ where: { id: taskId } });

      return successResponse({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('[DELETE TASK ERROR]', error);
      return errorResponse('Failed to delete task', 500);
    }
  });
}
