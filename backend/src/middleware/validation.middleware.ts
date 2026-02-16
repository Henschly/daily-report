import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/AppError.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};

export const schemas = {
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['staff', 'hr', 'hod', 'admin']).optional().default('staff'),
    departmentId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  updateUser: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.enum(['staff', 'hr', 'hod', 'admin']).optional(),
    departmentId: z.string().uuid().nullable().optional(),
    unitId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),

  createReport: z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'annual']),
    title: z.string().optional(),
    content: z.any(),
    date: z.string(),
    weekNumber: z.number().optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number(),
  }),

  updateReport: z.object({
    title: z.string().optional(),
    content: z.any().optional(),
  }),

  createComment: z.object({
    content: z.string().min(1, 'Comment content is required'),
    parentId: z.string().uuid().optional(),
  }),

  createDeadline: z.object({
    departmentId: z.string().uuid().nullable().optional(),
    unitId: z.string().uuid().nullable().optional(),
    type: z.enum(['daily', 'weekly', 'monthly']),
    deadlineTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
  }),

  uuid: z.string().uuid(),
};
