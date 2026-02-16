# Staff Daily Reporting & Performance Management System

A production-ready web application for staff to submit daily reports with HR/HOD review capabilities, automated compilation, and comprehensive audit tracking.

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with refresh tokens
- **Validation:** Zod
- **Email:** Nodemailer
- **Cron Jobs:** node-cron

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Rich Text Editor:** TipTap
- **HTTP Client:** Axios
- **Routing:** React Router v6

## Features

- ✅ JWT Authentication with role-based access control
- ✅ Rich text report editor (TipTap) with formatting, tables, images
- ✅ Daily, Weekly, Monthly, and Annual report compilation
- ✅ Report locking/unlocking by HR
- ✅ Edit history tracking (versions)
- ✅ Comment/feedback system
- ✅ In-app and email notifications
- ✅ Export to PDF and DOCX
- ✅ Automated cron jobs for reminders and report generation
- ✅ Department and unit management

## User Roles

| Role | Description |
|------|-------------|
| Staff | Submit and manage own reports |
| HR | Review, comment, lock/unlock, edit all reports |
| HOD | View department reports, comment |
| Admin | Full system access |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE daily_report;
```

2. Update the `.env` file with your database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/daily_report
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Staff | staff@example.com | password123 |
| HR | hr@example.com | password123 |
| HOD | hod@example.com | password123 |
| Admin | admin@example.com | password123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete draft
- `POST /api/reports/:id/submit` - Submit report
- `POST /api/reports/:id/lock` - Lock report (HR)
- `POST /api/reports/:id/unlock` - Unlock report (HR)
- `GET /api/reports/:id/versions` - Get edit history (HR/HOD)
- `GET /api/reports/:id/export` - Export report

### Compiled Reports
- `GET /api/compiled-reports` - List compiled reports
- `POST /api/compiled-reports/weekly` - Generate weekly
- `POST /api/compiled-reports/monthly` - Generate monthly
- `POST /api/compiled-reports/annual` - Generate annual

### Other
- `GET /api/notifications` - Get notifications
- `GET /api/departments` - List departments
- `GET /api/deadlines` - List deadlines (HR/Admin)

## Cron Jobs

- **Daily at midnight:** Lock overdue reports
- **Daily at 6 PM:** Send daily reminders
- **Weekly (Sunday):** Generate weekly compilations
- **Monthly (1st):** Generate monthly compilations

## Project Structure

```
daily-report/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   ├── prisma/        # Database schema
│   │   └── types/         # TypeScript types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── package.json
└── SPEC.md                # Detailed specification
```

## Environment Variables

### Backend (.env)
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daily_report
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

## License

MIT
