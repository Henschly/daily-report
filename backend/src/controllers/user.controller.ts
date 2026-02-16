import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest, PaginatedResponse } from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';
import { paginate, getPaginationMeta } from '../utils/helpers.js';

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { page = 1, limit = 10, departmentId, role, search } = req.query;

      const where: any = {};

      if (departmentId) {
        where.departmentId = departmentId as string;
      }

      if (role) {
        where.role = role;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (user.role === 'hod') {
        where.departmentId = user.departmentId;
      }

      const { skip, take } = paginate(Number(page), Number(limit));

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          include: {
            department: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const data = users.map((u) => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

      const meta = getPaginationMeta(total, Number(page), Number(limit));

      res.json({
        success: true,
        data,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = (req as AuthRequest).user!;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (currentUser.role === 'staff' && currentUser.id !== id) {
        throw new ForbiddenError('Access denied');
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = (req as AuthRequest).user!;
      const updateData = req.body;

      if (currentUser.role === 'staff' && currentUser.id !== id) {
        throw new ForbiddenError('Access denied');
      }

      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        delete updateData.role;
        delete updateData.isActive;
        delete updateData.departmentId;
        delete updateData.unitId;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          department: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = (req as AuthRequest).user!;
      const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;

      if (currentUser.role === 'staff' && currentUser.id !== id) {
        throw new ForbiddenError('Access denied');
      }

      const where: any = { userId: id };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
      }

      const { skip, take } = paginate(Number(page), Number(limit));

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take,
          orderBy: { date: 'desc' },
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
}

export const userController = new UserController();
