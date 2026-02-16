# Staff Daily Reporting & Performance Management System

## Project Overview

**Project Name:** Staff Daily Reporting & Performance Management System  
**Project Type:** Full-stack Web Application  
**Core Functionality:** A comprehensive reporting system where staff submit daily reports, HR/HOD review and manage them, with automated weekly/monthly compilation, audit tracking, and export capabilities.  
**Target Users:** Staff members, HR personnel, Heads of Department (HOD), and Administrators

---

## Tech Stack

### Frontend
- **Framework:** React 18+ with Vite
- **Language:** TypeScript
- **UI Library:** Custom CSS with CSS Variables
- **Rich Text Editor:** TipTap (based on ProseMirror)
- **HTTP Client:** Axios
- **State Management:** React Context + useReducer
- **Routing:** React Router v6
- **Date Handling:** date-fns
- **Export Libraries:** jsPDF, docx

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (better for relational data)
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Email:** Nodemailer
- **Cron Jobs:** node-cron
- **File Upload:** Multer

### Database
- PostgreSQL 14+

---

## UI/UX Specification

### Color Palette
```css
--color-primary: #2563eb;        /* Blue - primary actions */
--color-primary-dark: #1d4ed8;   /* Darker blue - hover states */
--color-primary-light: #3b82f6;  /* Lighter blue - active states */
--color-secondary: #64748b;     /* Slate - secondary text */
--color-accent: #10b981;        /* Emerald - success states */
--color-warning: #f59e0b;       /* Amber - warnings */
--color-danger: #ef4444;        /* Red - errors, locked states */
--color-background: #f8fafc;    /* Light gray - page background */
--color-surface: #ffffff;        /* White - cards, panels */
--color-border: #e2e8f0;         /* Light border */
--color-text: #1e293b;          /* Dark slate - primary text */
--color-text-secondary: #64748b; /* Slate - secondary text */
--color-sidebar: #1e293b;       /* Dark - sidebar background */
--color-sidebar-text: #f1f5f9;   /* Light - sidebar text */
```

### Typography
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem; /* 30px */

--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Layout Structure

#### Main Layout
- **Sidebar:** Fixed left, 260px width, dark background
- **Main Content:** Fluid width, max-width 1400px, centered
- **Header:** Sticky top, 64px height, white background with shadow
- **Content Area:** Scrollable, padding 24px

#### Responsive Breakpoints
- **Mobile:** < 768px (sidebar collapses to hamburger menu)
- **Tablet:** 768px - 1024px (sidebar minimized)
- **Desktop:** > 1024px (full layout)

### Component Specifications

#### Buttons
- **Primary:** Blue background, white text, 8px border-radius, 12px 24px padding
- **Secondary:** White background, blue border, blue text
- **Danger:** Red background, white text
- **States:** Hover (darken 10%), Active (scale 0.98), Disabled (opacity 0.5)
- **Sizes:** Small (28px height), Medium (36px height), Large (44px height)

#### Cards
- **Background:** White
- **Border:** 1px solid --color-border
- **Border Radius:** 12px
- **Shadow:** 0 1px 3px rgba(0,0,0,0.1)
- **Padding:** 24px

#### Form Inputs
- **Height:** 40px (default), 48px (large)
- **Border:** 1px solid --color-border
- **Border Radius:** 8px
- **Focus:** 2px ring in --color-primary
- **Padding:** 12px 16px

#### Tables
- **Header:** Light gray background, semibold text
- **Rows:** Alternating white/gray background
- **Hover:** Subtle blue tint
- **Border:** 1px solid --color-border

#### Status Badges
- **Draft:** Gray background, gray text
- **Submitted:** Blue background, blue text
- **Reviewed:** Emerald background, emerald text
- **Locked:** Red background, red text
- **Pending:** Amber background, amber text

#### Notifications Panel
- **Position:** Slide-in from right
- **Width:** 380px
- **Max Height:** 100vh - 64px
- **Animation:** Slide 300ms ease

---

## Database Schema

### Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| role | ENUM('staff', 'hr', 'hod', 'admin') | NOT NULL |
| department_id | UUID | FOREIGN KEY |
| unit_id | UUID | FOREIGN KEY (nullable) |
| is_active | BOOLEAN | DEFAULT true |
| last_login | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### departments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### units
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| department_id | UUID | FOREIGN KEY |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### reports
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY |
| type | ENUM('daily', 'weekly', 'monthly', 'annual') | NOT NULL |
| title | VARCHAR(255) | |
| content | JSONB | Rich text content |
| status | ENUM('draft', 'submitted', 'reviewed', 'locked') | DEFAULT 'draft' |
| date | DATE | NOT NULL |
| week_number | INTEGER | (for weekly) |
| month | INTEGER | (for monthly/annual) |
| year | INTEGER | NOT NULL |
| is_locked | BOOLEAN | DEFAULT false |
| locked_by | UUID | FOREIGN KEY |
| locked_at | TIMESTAMP | |
| deadline | TIMESTAMP | |
| submitted_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### report_versions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| report_id | UUID | FOREIGN KEY |
| content | JSONB | Previous content |
| edited_by | UUID | FOREIGN KEY |
| edit_reason | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| report_id | UUID | FOREIGN KEY |
| user_id | UUID | FOREIGN KEY |
| parent_id | UUID | FOREIGN KEY (self-ref for threads) |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### compiled_reports
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY |
| type | ENUM('weekly', 'monthly', 'annual') | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| content | JSONB | Compiled content |
| date_range_start | DATE | NOT NULL |
| date_range_end | DATE | NOT NULL |
| included_reports | UUID[] | Array of report IDs |
| status | ENUM('draft', 'published') | DEFAULT 'draft' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY |
| type | ENUM('reminder', 'feedback', 'lock', 'unlock', 'deadline', 'system') | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| message | TEXT | NOT NULL |
| is_read | BOOLEAN | DEFAULT false |
| related_report_id | UUID | FOREIGN KEY (nullable) |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### deadlines
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| department_id | UUID | FOREIGN KEY |
| unit_id | UUID | FOREIGN KEY (nullable) |
| type | ENUM('daily', 'weekly', 'monthly') | NOT NULL |
| deadline_time | TIME | NOT NULL |
| day_of_week | INTEGER | (for weekly, 0-6) |
| day_of_month | INTEGER | (for monthly, 1-31) |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Indexes
- `idx_reports_user_date` ON reports(user_id, date)
- `idx_reports_user_type_date` ON reports(user_id, type, date)
- `idx_reports_status` ON reports(status)
- `idx_reports_deadline` ON reports(deadline)
- `idx_notifications_user_read` ON notifications(user_id, is_read)
- `idx_comments_report` ON comments(report_id)

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login user | Public |
| POST | /api/auth/logout | Logout user | Auth |
| GET | /api/auth/me | Get current user | Auth |
| POST | /api/auth/refresh | Refresh token | Auth |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/users | List users | HR/Admin |
| GET | /api/users/:id | Get user details | HR/Admin/Self |
| PUT | /api/users/:id | Update user | HR/Admin/Self |
| DELETE | /api/users/:id | Deactivate user | Admin |
| GET | /api/users/:id/reports | Get user's reports | HR/HOD/Self |

### Departments & Units
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/departments | List departments | Auth |
| GET | /api/departments/:id/units | List units in department | Auth |
| POST | /api/departments | Create department | Admin |
| PUT | /api/departments/:id | Update department | Admin |

### Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/reports | List reports (filtered) | Auth |
| GET | /api/reports/:id | Get report details | Auth |
| POST | /api/reports | Create report | Staff |
| PUT | /api/reports/:id | Update report | Staff/HR |
| DELETE | /api/reports/:id | Delete draft report | Staff |
| POST | /api/reports/:id/submit | Submit report | Staff |
| POST | /api/reports/:id/lock | Lock report | HR |
| POST | /api/reports/:id/unlock | Unlock report | HR |
| GET | /api/reports/:id/versions | Get edit history | HR/HOD |
| POST | /api/reports/:id/export | Export report | Auth |

### Compiled Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/compiled-reports | List compiled reports | Auth |
| GET | /api/compiled-reports/:id | Get compiled report | Auth |
| POST | /api/compiled-reports/weekly | Generate weekly report | System/Staff |
| POST | /api/compiled-reports/monthly | Generate monthly report | System/Staff |
| POST | /api/compiled-reports/annual | Generate annual report | Staff |
| POST | /api/compiled-reports/:id/export | Export compiled report | Auth |

### Comments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/reports/:id/comments | Get report comments | Auth |
| POST | /api/reports/:id/comments | Add comment | Auth |
| PUT | /api/comments/:id | Update comment | Comment Author |
| DELETE | /api/comments/:id | Delete comment | Comment Author/HR |

### Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/notifications | Get user notifications | Auth |
| PUT | /api/notifications/:id/read | Mark as read | Auth |
| PUT | /api/notifications/read-all | Mark all as read | Auth |
| DELETE | /api/notifications/:id | Delete notification | Auth |

### Deadlines
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/deadlines | List deadlines | HR/Admin |
| POST | /api/deadlines | Create deadline | HR/Admin |
| PUT | /api/deadlines/:id | Update deadline | HR/Admin |
| DELETE | /api/deadlines/:id | Delete deadline | HR/Admin |

---

## Functionality Specification

### 1. Authentication System
- JWT-based authentication with access and refresh tokens
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry (stored in httpOnly cookie)
- Password hashing with bcrypt (12 rounds)
- Role-based access control middleware

### 2. Report Submission Flow
1. Staff logs in → Dashboard shows today's report status
2. If no report exists → "Create Report" button prominent
3. Staff clicks "Create" → Opens TipTap editor
4. Staff writes report → Can save as draft anytime
5. Staff clicks "Submit" → Status changes to "submitted"
6. HR reviews → Can comment, edit (creates version), lock
7. Locked reports → Staff can request unlock via comment

### 3. Report Locking Logic
- Reports can only be locked by HR
- Once locked:
  - Staff cannot edit
  - Staff can comment requesting unlock
  - HR must explicitly unlock
- Deadline-based auto-lock:
  - HR sets deadline per department/unit
  - Cron job checks deadlines at midnight
  - Past deadline reports auto-lock

### 4. Version Tracking
- Every HR edit creates a new version entry
- Version stores: previous content, editor, timestamp, reason
- View history shows all versions chronologically
- Compare view shows before/after diff

### 5. Notification System
- In-app notifications: Real-time via polling (30s interval)
- Email notifications: Sent via nodemailer
- Notification types:
  - Daily reminder (6 PM if no report submitted)
  - Feedback added (immediate)
  - Report locked/unlocked (immediate)
  - Deadline warning (24h before deadline)
  - Deadline passed (immediate)

### 6. Export System
- PDF: Uses jsPDF with html2canvas for rich formatting
- DOCX: Uses docx library for native Word export
- Export includes: header (user info, date), content, comments section

### 7. Cron Jobs
- **Daily at midnight:** Check and lock overdue reports
- **Daily at 6 PM:** Send reminder notifications
- **Weekly on Sunday midnight:** Generate weekly compilations
- **Monthly on 1st midnight:** Generate monthly compilations

---

## Page Specifications

### 1. Login Page
- Centered card layout
- Email/password fields
- "Remember me" checkbox
- "Forgot password" link (UI only for MVP)
- Register link for new users

### 2. Register Page
- Multi-step form:
  - Step 1: Email, password, confirm password
  - Step 2: First name, last name
  - Step 3: Department selection, Unit selection (if applicable)
  - Step 4: Review and submit

### 3. Staff Dashboard
- **Header:** Welcome message, current date
- **Quick Stats:** Reports submitted this week/month
- **Today's Report Card:** Status, quick action button
- **Recent Reports Table:** Last 10 reports with status, date, actions
- **Notifications Panel:** Recent 5 notifications

### 4. Report Editor Page
- **Title:** "Daily Report - [Date]"
- **TipTap Editor:** Full toolbar (bold, italic, lists, tables, images)
- **Image Upload:** Drag & drop or click to upload
- **Actions:** Save Draft, Submit, Cancel
- **Status Bar:** Current status, last saved time

### 5. HR/HOD Dashboard
- **Department Filter:** Dropdown to filter by department
- **Date Range Picker:** Filter reports by date
- **Reports Grid:** Cards showing report previews
- **Quick Actions:** Export, Lock All, Send Reminders
- **Stats:** Submission rate, pending reviews

### 6. Report Review Page
- **Report Display:** Full report content (read-only for staff)
- **Comment Thread:** Threaded comments below
- **HR Actions:** Edit (opens modal), Lock/Unlock, Export
- **Version History:** Button to view edit history
- **Staff View:** See comments, request unlock

### 7. Report History Page
- **Timeline:** Chronological list of versions
- **Compare View:** Side-by-side or diff view
- **Version Details:** Who edited, when, reason

### 8. Compiled Reports Page
- **Tabs:** Weekly | Monthly | Annual
- **List View:** All compiled reports
- **Generate Modal:** Select date range, include reports
- **Preview:** View compiled content
- **Export:** PDF/DOCX buttons

### 9. Settings Page (HR/Admin)
- **Deadline Management:** CRUD for deadlines
- **Department Management:** CRUD for departments/units
- **User Management:** View, deactivate users
- **Email Settings:** Configure email notifications (UI only)

---

## Acceptance Criteria

### Authentication
- [ ] Users can register with email, password, name, department
- [ ] Users can login with email/password
- [ ] JWT tokens are properly issued and validated
- [ ] Role-based access is enforced on all endpoints

### Reports
- [ ] Staff can create daily reports with rich text
- [ ] Staff can save drafts and submit later
- [ ] One report per user per day enforced
- [ ] Reports can be locked/unlocked by HR
- [ ] Edit history is tracked for HR edits

### Notifications
- [ ] Daily reminders are sent at configured time
- [ ] In-app notifications appear in real-time
- [ ] Notifications are marked as read when clicked

### Export
- [ ] Reports can be exported to PDF
- [ ] Reports can be exported to DOCX
- [ ] Compiled reports can be exported

### Performance
- [ ] Dashboard loads in under 2 seconds
- [ ] Report editor is responsive
- [ ] Large report lists use pagination

---

## Folder Structure

```
daily-report/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   ├── compiled-report.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── deadline.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── export.service.ts
│   │   │   └── cron.service.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── compiled-report.routes.ts
│   │   │   ├── comment.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── deadline.routes.ts
│   │   ├── utils/
│   │   │   ├── AppError.ts
│   │   │   └── helpers.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── editor/
│   │   │   └── reports/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```
