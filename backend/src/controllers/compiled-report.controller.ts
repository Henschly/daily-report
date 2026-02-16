import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError.js';
import { paginate, getPaginationMeta, formatDate, getWeekDateRange, getMonthDateRange } from '../utils/helpers.js';
import { exportService } from '../services/export.service.ts';

export class CompiledReportController {
  async getCompiledReports(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { page = 1, limit = 10, type } = req.query;

      const where: any = {};

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
      }

      if (type) {
        where.type = type;
      }

      const { skip, take } = paginate(Number(page), Number(limit));

      const [reports, total] = await Promise.all([
        prisma.compiledReport.findMany({
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
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.compiledReport.count({ where }),
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

  async getCompiledReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as AuthRequest).user!;

      const report = await prisma.compiledReport.findUnique({
        where: { id },
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

      if (!report) {
        throw new NotFoundError('Compiled report not found');
      }

      if (user.role === 'staff' && report.userId !== user.id) {
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

  async generateWeeklyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { date } = req.body;

      const reportDate = new Date(date);
      const { start, end } = getWeekDateRange(reportDate);
      const weekNumber = parseInt(formatDate(start).split('-')[1]);
      const year = getYearFromDate(start);

      const dailyReports = await prisma.report.findMany({
        where: {
          userId: user.id,
          type: 'daily',
          date: { gte: start, lte: end },
          status: { in: ['submitted', 'reviewed', 'locked'] },
        },
        orderBy: { date: 'asc' },
      });

      if (dailyReports.length === 0) {
        throw new BadRequestError('No daily reports found for this week');
      }

      const content = {
        type: 'weekly',
        weekNumber,
        year,
        reports: dailyReports.map((r) => ({
          date: formatDate(r.date),
          content: r.content,
        })),
      };

      const compiled = await prisma.compiledReport.create({
        data: {
          userId: user.id,
          type: 'weekly',
          title: `Weekly Report - Week ${weekNumber}, ${year}`,
          content,
          dateRangeStart: start,
          dateRangeEnd: end,
          includedReports: dailyReports.map((r) => r.id),
          status: 'draft',
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: compiled,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { date } = req.body;

      const reportDate = new Date(date);
      const { start, end } = getMonthDateRange(reportDate);
      const month = reportDate.getMonth() + 1;
      const year = reportDate.getFullYear();

      const reports = await prisma.report.findMany({
        where: {
          userId: user.id,
          type: 'daily',
          date: { gte: start, lte: end },
          status: { in: ['submitted', 'reviewed', 'locked'] },
        },
        orderBy: { date: 'asc' },
      });

      const weeklyReports = await prisma.compiledReport.findMany({
        where: {
          userId: user.id,
          type: 'weekly',
          dateRangeStart: { gte: start },
          dateRangeEnd: { lte: end },
        },
      });

      if (reports.length === 0 && weeklyReports.length === 0) {
        throw new BadRequestError('No reports found for this month');
      }

      const content = {
        type: 'monthly',
        month,
        year,
        dailyReports: reports.map((r) => ({
          date: formatDate(r.date),
          content: r.content,
        })),
        weeklyReports: weeklyReports.map((r) => ({
          title: r.title,
          content: r.content,
        })),
      };

      const compiled = await prisma.compiledReport.create({
        data: {
          userId: user.id,
          type: 'monthly',
          title: `Monthly Report - ${reportDate.toLocaleString('default', { month: 'long' })} ${year}`,
          content,
          dateRangeStart: start,
          dateRangeEnd: end,
          includedReports: [...reports.map((r) => r.id), ...weeklyReports.map((r) => r.id)],
          status: 'draft',
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: compiled,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAnnualReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { year, monthIds } = req.body;

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const monthlyReports = await prisma.compiledReport.findMany({
        where: {
          userId: user.id,
          type: 'monthly',
          dateRangeStart: { gte: startDate, lte: endDate },
          ...(monthIds?.length ? {
            dateRangeStart: {
              in: monthIds.map((m: number) => new Date(year, m - 1, 1)),
            },
          } : {}),
        },
      });

      if (monthlyReports.length === 0) {
        throw new BadRequestError('No monthly reports found for this year');
      }

      const content = {
        type: 'annual',
        year,
        monthlyReports: monthlyReports.map((r) => ({
          title: r.title,
          content: r.content,
        })),
      };

      const compiled = await prisma.compiledReport.create({
        data: {
          userId: user.id,
          type: 'annual',
          title: `Annual Report - ${year}`,
          content,
          dateRangeStart: startDate,
          dateRangeEnd: endDate,
          includedReports: monthlyReports.map((r) => r.id),
          status: 'draft',
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: compiled,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCompiledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { format: exportFormat } = req.query;

      if (exportFormat === 'pdf') {
        const pdfBuffer = await exportService.exportCompiledReportToPDF(id);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="compiled-report-${id}.pdf"`);
        res.send(pdfBuffer);
      } else if (exportFormat === 'docx') {
        const docxBuffer = await exportService.exportCompiledReportToDOCX(id);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="compiled-report-${id}.docx"`);
        res.send(docxBuffer);
      } else {
        throw new BadRequestError('Invalid export format. Use pdf or docx');
      }
    } catch (error) {
      next(error);
    }
  }
}

function getYearFromDate(date: Date): number {
  return date.getFullYear();
}

export const compiledReportController = new CompiledReportController();
