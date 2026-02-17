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
    await prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000001', name: 'Engineering', description: 'Software Engineering Department' },
    });
    await prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000002', name: 'Human Resources', description: 'Human Resources Department' },
    });
    await prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000003', name: 'Marketing', description: 'Marketing Department' },
    });
    await prisma.unit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000010' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000010', name: 'Frontend Team', departmentId: '00000000-0000-0000-0000-000000000001' },
    });
    await prisma.unit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000011', name: 'Backend Team', departmentId: '00000000-0000-0000-0000-000000000001' },
    });
    res.json({ success: true, message: 'Database initialized' });
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
