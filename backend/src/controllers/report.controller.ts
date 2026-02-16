import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest, ReportFilters } from '../types/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError.js';
import { paginate, getPaginationMeta, formatDate, generateReportTitle, getWeekNumber, getMonthFromDate, getYearFromDate } from '../utils/helpers.js';
import { exportService } from '../services/export.service.js';
import { notificationService } from '../services/notification.service.js';

export class ReportController {
  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { 
        page = 1, 
        limit = 10, 
        userId, 
        departmentId, 
        unitId, 
        type, 
        status, 
        startDate, 
        endDate 
      } = req.query as Record<string, any>;

      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (user.role === 'staff') {
        where.userId = user.id;
      } else if (user.role === 'hod') {
        const hodUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { departmentId: true },
        });
        
        if (hodUser?.departmentId) {
          where.user = { departmentId: hodUser.departmentId };
        }
        
        if (departmentId) {
          where.user = { departmentId };
        }
      }

      if (user.role === 'hr' && departmentId) {
        where.user = { departmentId };
      }

      const { skip, take } = paginate(Number(page), Number(limit));

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.report.count({ where }),
      ]);

      const meta = getPaginationMeta(total, Number(page), Number(limit));

      res.json({
        success: true,
        data: reports,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = (req as AuthRequest).user!;

      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true } },
            },
          },
          lockedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          comments: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, role: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (currentUser.role === 'staff' && report.userId !== currentUser.id) {
        throw new ForbiddenError('Access denied');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { type, title, content, date, weekNumber, month, year } = req.body;

      const reportDate = new Date(date);

      const existingReport = await prisma.report.findFirst({
        where: {
          userId: user.id,
          type,
          date: {
            gte: new Date(reportDate.setHours(0, 0, 0, 0)),
            lt: new Date(reportDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReport && type === 'daily') {
        throw new BadRequestError('A daily report already exists for this date');
      }

      const reportTitle = title || generateReportTitle(type, reportDate);

      const report = await prisma.report.create({
        data: {
          userId: user.id,
          type,
          title: reportTitle,
          content,
          date: new Date(date),
          weekNumber: weekNumber || (type === 'weekly' ? getWeekNumber(reportDate) : undefined),
          month: month || (['monthly', 'annual'].includes(type) ? getMonthFromDate(reportDate) : undefined),
          year: year || getYearFromDate(reportDate),
          status: 'draft',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;
      const { title, content, editReason } = req.body;

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.isLocked) {
        throw new ForbiddenError('Cannot edit a locked report');
      }

      const isOwner = report.userId === user.id;
      const isHR = user.role === 'hr' || user.role === 'admin';
      const isHOD = user.role === 'hod';

      if (!isOwner && !isHR && !isHOD) {
        throw new ForbiddenError('You can only edit your own reports');
      }

      if (!isOwner && (isHR || isHOD)) {
        await prisma.reportVersion.create({
          data: {
            reportId: report.id,
            content: report.content,
            editedById: user.id,
            editReason: editReason || 'Edited by HR/HOD',
          },
        });
      }

      const updatedReport = await prisma.report.update({
        where: { id },
        data: {
          title: title || report.title,
          content: content || report.content,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.userId !== user.id) {
        throw new ForbiddenError('You can only delete your own reports');
      }

      if (report.status !== 'draft') {
        throw new ForbiddenError('Only draft reports can be deleted');
      }

      await prisma.report.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async submitReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.userId !== user.id) {
        throw new ForbiddenError('You can only submit your own reports');
      }

      if (report.isLocked) {
        throw new ForbiddenError('Cannot submit a locked report');
      }

      const updatedReport = await prisma.report.update({
        where: { id },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  async lockReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      if (user.role !== 'hr' && user.role !== 'admin') {
        throw new ForbiddenError('Only HR can lock reports');
      }

      const report = await prisma.report.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      const updatedReport = await prisma.report.update({
        where: { id },
        data: {
          isLocked: true,
          status: 'locked',
          lockedById: user.id,
          lockedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await notificationService.notifyReportLocked(
        report.userId,
        id,
        formatDate(report.date)
      );

      res.json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  async unlockReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      if (user.role !== 'hr' && user.role !== 'admin') {
        throw new ForbiddenError('Only HR can unlock reports');
      }

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      const updatedReport = await prisma.report.update({
        where: { id },
        data: {
          isLocked: false,
          status: 'submitted',
          lockedById: null,
          lockedAt: null,
        },
      });

      await notificationService.notifyReportUnlocked(
        report.userId,
        id,
        formatDate(report.date)
      );

      res.json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (user.role === 'staff' && report.userId !== user.id) {
        throw new ForbiddenError('Access denied');
      }

      const versions = await prisma.reportVersion.findMany({
        where: { reportId: id },
        include: {
          editedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { format: exportFormat } = req.query;

      if (exportFormat === 'pdf') {
        const pdfBuffer = await exportService.exportReportToPDF(id);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
        res.send(pdfBuffer);
      } else if (exportFormat === 'docx') {
        const docxBuffer = await exportService.exportReportToDOCX(id);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.docx"`);
        res.send(docxBuffer);
      } else {
        throw new BadRequestError('Invalid export format. Use pdf or docx');
      }
    } catch (error) {
      next(error);
    }
  }

  async getTodayReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const report = await prisma.report.findFirst({
        where: {
          userId: user.id,
          type: 'daily',
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
