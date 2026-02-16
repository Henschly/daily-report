import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { page = 1, limit = 20 } = req.query;

      const result = await notificationService.getNotifications(
        user.id,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const count = await notificationService.getUnreadCount(user.id);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      await notificationService.markAsRead(id, user.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;

      await notificationService.markAllAsRead(user.id);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      await notificationService.deleteNotification(id, user.id);

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
