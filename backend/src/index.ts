import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { cronService } from './services/cron.service.js';
import { AppError } from './utils/AppError.js';
import prisma from './config/prisma.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import compiledReportRoutes from './routes/compiled-report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import deadlineRoutes from './routes/deadline.routes.js';
import departmentRoutes from './routes/department.routes.js';

const app = express();

async function syncDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}
syncDatabase();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/compiled-reports', compiledReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/departments', departmentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/setup', async (req, res) => {
  try {
    // Create enums
    await prisma.$executeRaw`CREATE TYPE "UserRole" AS ENUM ('staff', 'hr', 'hod', 'admin')`;
    await prisma.$executeRaw`CREATE TYPE "ReportType" AS ENUM ('daily', 'weekly', 'monthly', 'annual')`;
    await prisma.$executeRaw`CREATE TYPE "ReportStatus" AS ENUM ('draft', 'submitted', 'reviewed', 'locked')`;
    await prisma.$executeRaw`CREATE TYPE "NotificationType" AS ENUM ('reminder', 'feedback', 'lock', 'unlock', 'deadline', 'system')`;
    await prisma.$executeRaw`CREATE TYPE "DeadlineType" AS ENUM ('daily', 'weekly', 'monthly')`;
    
    // Create tables using raw SQL
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, role VARCHAR(20) DEFAULT 'staff', department_id UUID, unit_id UUID, is_active BOOLEAN DEFAULT true, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS departments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS units (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL, department_id UUID NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, type VARCHAR(20) NOT NULL, title VARCHAR(255), content JSONB, status VARCHAR(20) DEFAULT 'draft', date DATE NOT NULL, week_number INTEGER, month INTEGER, year INTEGER NOT NULL, is_locked BOOLEAN DEFAULT false, locked_by UUID, locked_at TIMESTAMP, deadline TIMESTAMP, submitted_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS report_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), report_id UUID NOT NULL, content JSONB, edited_by UUID NOT NULL, edit_reason TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS comments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), report_id UUID NOT NULL, user_id UUID NOT NULL, parent_id UUID, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS compiled_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, type VARCHAR(20) NOT NULL, title VARCHAR(255) NOT NULL, content JSONB, date_range_start DATE NOT NULL, date_range_end DATE NOT NULL, included_reports TEXT[], status VARCHAR(20) DEFAULT 'draft', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, type VARCHAR(20) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, is_read BOOLEAN DEFAULT false, related_report_id UUID, created_at TIMESTAMP DEFAULT NOW())`;
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS deadlines (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), department_id UUID, unit_id UUID, type VARCHAR(20) NOT NULL, deadline_time VARCHAR(10) NOT NULL, day_of_week INTEGER, day_of_month INTEGER, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`;
    
    // Insert initial data
    await prisma.$executeRaw`INSERT INTO departments (id, name, description) VALUES ('00000000-0000-0000-0000-000000000001', 'Engineering', 'Software Engineering Department') ON CONFLICT DO NOTHING`;
    await prisma.$executeRaw`INSERT INTO departments (id, name, description) VALUES ('00000000-0000-0000-0000-000000000002', 'Human Resources', 'Human Resources Department') ON CONFLICT DO NOTHING`;
    await prisma.$executeRaw`INSERT INTO departments (id, name, description) VALUES ('00000000-0000-0000-0000-000000000003', 'Marketing', 'Marketing Department') ON CONFLICT DO NOTHING`;
    
    await prisma.$executeRaw`INSERT INTO units (id, name, department_id) VALUES ('00000000-0000-0000-0000-000000000010', 'Frontend Team', '00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING`;
    await prisma.$executeRaw`INSERT INTO units (id, name, department_id) VALUES ('00000000-0000-0000-0000-000000000011', 'Backend Team', '00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING`;
    
    res.json({ success: true, message: 'Database initialized with tables and data' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.get('/', (req, res) => {
  res.redirect('http://localhost:5173');
});

app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('Error:', err);

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  
  if (config.nodeEnv === 'production') {
    cronService.start();
  }
});

export default app;
