export type UserRole = 'staff' | 'hr' | 'hod' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  unitId?: string;
  department?: { id: string; name: string };
  unit?: { id: string; name: string };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  units?: Unit[];
}

export interface Unit {
  id: string;
  name: string;
  departmentId: string;
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual';
export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'locked';

export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  title?: string;
  content: any;
  status: ReportStatus;
  date: string;
  weekNumber?: number;
  month?: number;
  year: number;
  isLocked: boolean;
  lockedById?: string;
  lockedAt?: string;
  deadline?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  lockedBy?: User;
  comments?: Comment[];
}

export interface ReportVersion {
  id: string;
  reportId: string;
  content: any;
  editedById: string;
  editReason?: string;
  createdAt: string;
  editedBy?: User;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replies?: Comment[];
}

export interface CompiledReport {
  id: string;
  userId: string;
  type: ReportType;
  title: string;
  content: any;
  dateRangeStart: string;
  dateRangeEnd: string;
  includedReports: string[];
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export type NotificationType = 'reminder' | 'feedback' | 'lock' | 'unlock' | 'deadline' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedReportId?: string;
  createdAt: string;
  report?: {
    id: string;
    date: string;
    type: ReportType;
  };
}

export interface Deadline {
  id: string;
  departmentId?: string;
  unitId?: string;
  type: 'daily' | 'weekly' | 'monthly';
  deadlineTime: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive: boolean;
  createdAt: string;
  department?: Department;
  unit?: Unit;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}
