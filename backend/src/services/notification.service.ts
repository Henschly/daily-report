import prisma from '../config/prisma.js';
import { NotificationType } from '../types/index.js';

class NotificationService {
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedReportId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedReportId: data.relatedReportId,
      },
    });
  }

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          report: {
            select: {
              id: true,
              date: true,
              type: true,
            },
          },
        },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  async notifyReportSubmitted(userId: string, reportId: string, date: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    return this.createNotification({
      userId,
      type: 'system',
      title: 'Report Submitted',
      message: `Your report for ${date} has been submitted successfully.`,
      relatedReportId: reportId,
    });
  }

  async notifyFeedbackAdded(reportOwnerId: string, reportId: string, date: string) {
    return this.createNotification({
      userId: reportOwnerId,
      type: 'feedback',
      title: 'New Feedback',
      message: `You have received new feedback on your report for ${date}.`,
      relatedReportId: reportId,
    });
  }

  async notifyReportLocked(userId: string, reportId: string, date: string) {
    return this.createNotification({
      userId,
      type: 'lock',
      title: 'Report Locked',
      message: `Your report for ${date} has been locked by HR.`,
      relatedReportId: reportId,
    });
  }

  async notifyReportUnlocked(userId: string, reportId: string, date: string) {
    return this.createNotification({
      userId,
      type: 'unlock',
      title: 'Report Unlocked',
      message: `Your report for ${date} has been unlocked.`,
      relatedReportId: reportId,
    });
  }

  async notifyDeadlineWarning(userId: string, deadline: string) {
    return this.createNotification({
      userId,
      type: 'deadline',
      title: 'Deadline Warning',
      message: `Your report deadline is approaching: ${deadline}.`,
    });
  }

  async sendDailyReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithoutReports = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'staff',
        NOT: {
          reports: {
            some: {
              date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              },
              type: 'daily',
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    const dateStr = today.toISOString().split('T')[0];

    for (const user of usersWithoutReports) {
      await this.createNotification({
        userId: user.id,
        type: 'reminder',
        title: 'Daily Report Reminder',
        message: `Please submit your daily report for ${dateStr}.`,
      });
    }

    return usersWithoutReports.length;
  }
}

export const notificationService = new NotificationService();
