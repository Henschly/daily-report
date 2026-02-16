import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { notificationService } from './notification.service.js';
import { emailService } from './email.service.js';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

class CronService {
  private jobs: cron.ScheduledTask[] = [];

  start() {
    this.lockOverdueReports();
    this.sendDailyReminders();
    this.generateWeeklyReports();
    this.generateMonthlyReports();
    console.log('Cron jobs started');
  }

  stop() {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    console.log('Cron jobs stopped');
  }

  private lockOverdueReports() {
    const job = cron.schedule('0 0 * * *', async () => {
      console.log('Running: Lock overdue reports');
      
      try {
        const now = new Date();
        
        const overdueReports = await prisma.report.findMany({
          where: {
            status: { in: ['draft', 'submitted', 'reviewed'] },
            deadline: { lt: now },
            isLocked: false,
          },
        });

        for (const report of overdueReports) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              isLocked: true,
              status: 'locked',
              lockedAt: now,
            },
          });
        }

        console.log(`Locked ${overdueReports.length} overdue reports`);
      } catch (error) {
        console.error('Error locking overdue reports:', error);
      }
    });

    this.jobs.push(job);
  }

  private sendDailyReminders() {
    const job = cron.schedule('0 18 * * *', async () => {
      console.log('Running: Send daily reminders');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const usersWithoutReports = await prisma.user.findMany({
          where: {
            isActive: true,
            role: 'staff',
            NOT: {
              reports: {
                some: {
                  date: {
                    gte: today,
                    lt: tomorrow,
                  },
                  type: 'daily',
                },
              },
            },
          },
        });

        const dateStr = format(today, 'MMMM d, yyyy');

        for (const user of usersWithoutReports) {
          await notificationService.createNotification({
            userId: user.id,
            type: 'reminder',
            title: 'Daily Report Reminder',
            message: `Please submit your daily report for ${dateStr}.`,
          });

          await emailService.sendDailyReminder(user.email, user.firstName, dateStr);
        }

        console.log(`Sent reminders to ${usersWithoutReports.length} users`);
      } catch (error) {
        console.error('Error sending daily reminders:', error);
      }
    });

    this.jobs.push(job);
  }

  private generateWeeklyReports() {
    const job = cron.schedule('0 0 * * 0', async () => {
      console.log('Running: Generate weekly reports');
      
      try {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const weekNumber = parseInt(format(weekStart, 'ww'));
        const year = parseInt(format(weekStart, 'yyyy'));

        const dailyReports = await prisma.report.findMany({
          where: {
            type: 'daily',
            date: { gte: weekStart, lte: weekEnd },
            status: { in: ['submitted', 'reviewed', 'locked'] },
          },
          include: {
            user: true,
          },
        });

        const reportsByUser = new Map<string, typeof dailyReports>();
        
        for (const report of dailyReports) {
          const existing = reportsByUser.get(report.userId) || [];
          existing.push(report);
          reportsByUser.set(report.userId, existing);
        }

        for (const [userId, reports] of reportsByUser) {
          const content = {
            type: 'weekly',
            weekNumber,
            year,
            reports: reports.map((r) => ({
              date: format(r.date, 'yyyy-MM-dd'),
              content: r.content,
            })),
          };

          await prisma.compiledReport.create({
            data: {
              userId,
              type: 'weekly',
              title: `Weekly Report - Week ${weekNumber}, ${year}`,
              content,
              dateRangeStart: weekStart,
              dateRangeEnd: weekEnd,
              includedReports: reports.map((r) => r.id),
              status: 'draft',
            },
          });
        }

        console.log(`Generated weekly reports for ${reportsByUser.size} users`);
      } catch (error) {
        console.error('Error generating weekly reports:', error);
      }
    });

    this.jobs.push(job);
  }

  private generateMonthlyReports() {
    const job = cron.schedule('0 0 1 * *', async () => {
      console.log('Running: Generate monthly reports');
      
      try {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        const dailyReports = await prisma.report.findMany({
          where: {
            type: 'daily',
            date: { gte: monthStart, lte: monthEnd },
            status: { in: ['submitted', 'reviewed', 'locked'] },
          },
          include: {
            user: true,
          },
        });

        const weeklyReports = await prisma.compiledReport.findMany({
          where: {
            type: 'weekly',
            dateRangeStart: { gte: monthStart },
            dateRangeEnd: { lte: monthEnd },
            status: 'draft',
          },
          include: {
            user: true,
          },
        });

        const reportsByUser = new Map<string, any[]>();
        
        for (const report of dailyReports) {
          const existing = reportsByUser.get(report.userId) || [];
          existing.push({ type: 'daily', data: report });
          reportsByUser.set(report.userId, existing);
        }

        for (const report of weeklyReports) {
          const existing = reportsByUser.get(report.userId) || [];
          existing.push({ type: 'weekly', data: report });
          reportsByUser.set(report.userId, existing);
        }

        for (const [userId, reports] of reportsByUser) {
          const content = {
            type: 'monthly',
            month,
            year,
            reports,
          };

          await prisma.compiledReport.create({
            data: {
              userId,
              type: 'monthly',
              title: `Monthly Report - ${format(today, 'MMMM yyyy')}`,
              content,
              dateRangeStart: monthStart,
              dateRangeEnd: monthEnd,
              includedReports: reports.map((r) => r.data.id),
              status: 'draft',
            },
          });
        }

        console.log(`Generated monthly reports for ${reportsByUser.size} users`);
      } catch (error) {
        console.error('Error generating monthly reports:', error);
      }
    });

    this.jobs.push(job);
  }
}

export const cronService = new CronService();
