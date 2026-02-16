import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';
import { formatDate } from '../utils/helpers.js';

export class CommentController {
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;

      const comments = await prisma.comment.findMany({
        where: { reportId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true, department: { select: { name: true } } },
          },
          replies: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, role: true },
              },
            },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const user = (req as AuthRequest).user!;
      const { content, parentId } = req.body;

      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
        });

        if (!parentComment) {
          throw new NotFoundError('Parent comment not found');
        }
      }

      const comment = await prisma.comment.create({
        data: {
          reportId,
          userId: user.id,
          content,
          parentId: parentId || null,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      if (report.userId !== user.id) {
        await notificationService.notifyFeedbackAdded(report.userId, reportId, formatDate(report.date));
      }

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;
      const { content } = req.body;

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      if (comment.userId !== user.id && user.role !== 'hr' && user.role !== 'admin') {
        throw new ForbiddenError('You can only edit your own comments');
      }

      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { content },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      res.json({
        success: true,
        data: updatedComment,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      if (comment.userId !== user.id && user.role !== 'hr' && user.role !== 'admin') {
        throw new ForbiddenError('You can only delete your own comments');
      }

      await prisma.comment.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
