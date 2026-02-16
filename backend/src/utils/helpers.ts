import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, getWeek, getMonth, getYear, isAfter, isBefore, addDays } from 'date-fns';
import { ReportType } from '../types/index.js';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm:ss');
};

export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM d, yyyy');
};

export const getWeekNumber = (date: Date | string): number => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getWeek(d);
};

export const getMonthFromDate = (date: Date | string): number => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getMonth(d) + 1;
};

export const getYearFromDate = (date: Date | string): number => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getYear(d);
};

export const getWeekDateRange = (date: Date | string): { start: Date; end: Date } => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  };
};

export const getMonthDateRange = (date: Date | string): { start: Date; end: Date } => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfMonth(d),
    end: endOfMonth(d),
  };
};

export const isDeadlinePassed = (deadline: Date | string | null): boolean => {
  if (!deadline) return false;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  return isAfter(new Date(), d);
};

export const getNextDeadline = (deadlineTime: string, dayOfWeek?: number, dayOfMonth?: number): Date => {
  const now = new Date();
  const [hours, minutes] = deadlineTime.split(':').map(Number);
  
  let deadline = new Date(now);
  deadline.setHours(hours, minutes, 0, 0);

  if (dayOfWeek !== undefined) {
    const currentDay = deadline.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    deadline = addDays(deadline, daysUntil);
  } else if (dayOfMonth !== undefined) {
    deadline.setDate(dayOfMonth);
    if (isBefore(deadline, now)) {
      deadline.setMonth(deadline.getMonth() + 1);
    }
  }

  if (isBefore(deadline, now)) {
    deadline = addDays(deadline, 1);
  }

  return deadline;
};

export const generateReportTitle = (type: ReportType, date: Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  switch (type) {
    case 'daily':
      return `Daily Report - ${formatDisplayDate(d)}`;
    case 'weekly':
      const weekRange = getWeekDateRange(d);
      return `Weekly Report - ${format(weekRange.start, 'MMM d')} - ${format(weekRange.end, 'MMM d, yyyy')}`;
    case 'monthly':
      return `Monthly Report - ${format(d, 'MMMM yyyy')}`;
    case 'annual':
      return `Annual Report - ${format(d, 'yyyy')}`;
    default:
      return `Report - ${formatDisplayDate(d)}`;
  }
};

export const paginate = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const getPaginationMeta = (total: number, page: number, limit: number) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
