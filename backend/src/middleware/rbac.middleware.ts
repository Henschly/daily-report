import { Response, NextFunction } from 'express';
import { UserRole, AuthRequest } from '../types/index.js';
import { ForbiddenError } from '../utils/AppError.js';

type Role = UserRole | 'all';

const roleHierarchy: Record<UserRole, number> = {
  staff: 1,
  hr: 2,
  hod: 3,
  admin: 4,
};

export const checkRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (allowedRoles.includes('all') || allowedRoles.includes(user.role)) {
      next();
      return;
    }

    next(new ForbiddenError('Insufficient permissions'));
  };
};

export const isStaff = checkRole('staff');
export const isHR = checkRole('hr');
export const isHOD = checkRole('hod');
export const isAdmin = checkRole('admin');
export const isHRorAdmin = checkRole('hr', 'admin');
export const isHODorHR = checkRole('hod', 'hr');
export const isHODorAdmin = checkRole('hod', 'admin');
export const anyRole = checkRole('staff', 'hr', 'hod', 'admin');

export const canEditReport = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthRequest).user;
  const { userId, isLocked } = req.body;

  if (!user) {
    next(new ForbiddenError('Authentication required'));
    return;
  }

  if (user.role === 'admin' || user.role === 'hr') {
    next();
    return;
  }

  if (user.role === 'hod') {
    next();
    return;
  }

  if (user.role === 'staff' && userId === user.id && !isLocked) {
    next();
    return;
  }

  next(new ForbiddenError('You can only edit your own reports'));
};

export const canViewReport = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthRequest).user;
  const reportUserId = req.params.userId || req.body.userId;

  if (!user) {
    next(new ForbiddenError('Authentication required'));
    return;
  }

  if (user.role === 'admin' || user.role === 'hr') {
    next();
    return;
  }

  if (user.role === 'hod' && reportUserId === user.id) {
    next();
    return;
  }

  if (user.role === 'staff' && reportUserId === user.id) {
    next();
    return;
  }

  next(new ForbiddenError('You can only view your own reports'));
};

export const hasHigherRole = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthRequest).user;
  const targetRole = req.body.role || req.params.role;

  if (!user) {
    next(new ForbiddenError('Authentication required'));
    return;
  }

  if (!targetRole || user.role === 'admin') {
    next();
    return;
  }

  if (roleHierarchy[user.role] > roleHierarchy[targetRole as UserRole]) {
    next();
    return;
  }

  next(new ForbiddenError('Cannot modify equal or higher role'));
};
