import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { NotFoundError } from '../utils/AppError.js';

export class DeadlineController {
  async getDeadlines(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, unitId, type, isActive } = req.query;

      const where: any = {};

      if (departmentId) {
        where.departmentId = departmentId as string;
      }

      if (unitId) {
        where.unitId = unitId as string;
      }

      if (type) {
        where.type = type;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const deadlines = await prisma.deadline.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: deadlines,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeadlineById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const deadline = await prisma.deadline.findUnique({
        where: { id },
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

      if (!deadline) {
        throw new NotFoundError('Deadline not found');
      }

      res.json({
        success: true,
        data: deadline,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDeadline(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, unitId, type, deadlineTime, dayOfWeek, dayOfMonth } = req.body;

      const deadline = await prisma.deadline.create({
        data: {
          departmentId: departmentId || null,
          unitId: unitId || null,
          type,
          deadlineTime,
          dayOfWeek: dayOfWeek || null,
          dayOfMonth: dayOfMonth || null,
          isActive: true,
        },
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: deadline,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDeadline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const deadline = await prisma.deadline.update({
        where: { id },
        data: updateData,
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

      res.json({
        success: true,
        data: deadline,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDeadline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.deadline.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Deadline deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const deadlineController = new DeadlineController();
