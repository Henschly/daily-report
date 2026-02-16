import { UserRole, ReportType, ReportStatus, NotificationType, DeadlineType } from '@prisma/client';

export type { UserRole, ReportType, ReportStatus, NotificationType, DeadlineType };

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface CreateReportInput {
  type: ReportType;
  title?: string;
  content: any;
  date: string;
  weekNumber?: number;
  month?: number;
  year: number;
}

export interface UpdateReportInput {
  title?: string;
  content?: any;
}

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}

export interface CreateDeadlineInput {
  departmentId?: string;
  unitId?: string;
  type: DeadlineType;
  deadlineTime: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface ReportFilters {
  userId?: string;
  departmentId?: string;
  unitId?: string;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
