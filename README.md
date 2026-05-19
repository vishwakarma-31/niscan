# Nicsan CRM — Mini Insurance Policy Management Module

A full-stack insurance policy management system built as a hiring assignment. Features include JWT authentication, PDF upload with AI-powered extraction via GPT-4o-mini, AWS S3 storage, real-time Socket.IO updates, and automated email notifications.

---

## Quick Start with Docker (Recommended)

```bash
# 1. Clone and navigate
cd nicsan

# 2. Configure environment
# Edit .env with your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here

# 3. Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# 4. Open the app
open http://localhost:3000
```

Docker Compose will automatically:
- Set up PostgreSQL with the database and schema
- Run seed users (admin + ops)
- Start the backend API on port 5000
- Start the frontend on port 3000

---

## Manual Setup (Without Docker)

### Prerequisites

- Node.js >= 18
- PostgreSQL
- (Optional) AWS account + S3 bucket
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Storage | AWS S3 (with local mock fallback) |
| Auth | JWT (Access + Refresh), bcrypt |
| Real-time | Socket.IO |
| Email | Nodemailer |
| AI | OpenAI GPT-4o-mini (PDF extraction) |

---

## Architecture

```
nicsan/
├── backend/
│   ├── config/         # DB, S3, Socket, Mailer configs
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, roles, upload, error handling
│   ├── repositories/   # Database queries
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (auth, policy, extraction, email)
│   ├── utils/          # JWT, logger, response helpers
│   ├── migrations/     # PostgreSQL schema
│   ├── seed.js         # Default users seeder
│   └── server.js       # Express app entry
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # AuthContext
│       ├── hooks/       # useSocket
│       ├── pages/       # Login, Dashboard, PolicyDetail, Upload
│       ├── services/    # API service layer
│       └── types/       # TypeScript interfaces
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL
- (Optional) AWS account + S3 bucket

### 1. Clone & Install

```bash
git clone <repo-url>
cd nicsan

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Copy the example and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `OPENAI_API_KEY` | OpenAI API key for PDF extraction |
| `AWS_ACCESS_KEY_ID` | AWS credentials (leave blank for local mock mode) |
| `S3_BUCKET_NAME` | S3 bucket name |
| `SMTP_USER` / `SMTP_PASS` | Email credentials for Nodemailer |

**For local development without AWS**, simply leave `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET_NAME` empty. The app will use local filesystem storage automatically.

### 3. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE nicsan_crm;"

# Run migrations (in order)
psql -d nicsan_crm -f backend/migrations/001_create_users.sql
psql -d nicsan_crm -f backend/migrations/002_create_policies.sql
psql -d nicsan_crm -f backend/migrations/003_create_activity_logs.sql
psql -d nicsan_crm -f backend/migrations/004_shared_trigger.sql

# Seed default users
cd backend
node seed.js
```

### 4. Run

```bash
# Terminal 1 — Backend (port 5000)
cd backend
node server.js

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@nicsan.in | Admin@123 |
| Ops | ops@nicsan.in | Ops@123 |

---

## Features

### Authentication
- JWT access tokens (15 min expiry) + refresh tokens (7 days)
- httpOnly cookie for refresh token
- Auto-refresh on 401 responses
- bcrypt password hashing (12 rounds)

### Policy Upload
- Drag-and-drop or browse PDF upload
- Max 5MB, PDF only (validated server-side)
- Stored in AWS S3 (or local `backend/uploads` in mock mode)
- Triggers async GPT-4o-mini extraction

### AI PDF Extraction
GPT-4o-mini extracts and returns structured data with confidence scores for:
- Policy Number
- Customer Name
- Vehicle Number
- Insurer Name
- Premium Amount

### Dashboard
- Paginated policy table (10 per page)
- Search by customer name or policy number
- Filter by status (Pending / Active / Expired / Cancelled)
- Summary cards (Total / Active / Pending / Expired + Cancelled)

### Policy Management
- View full policy details with confidence panel
- Download original PDF (presigned S3 URL)
- Admin: update status, delete policies
- Real-time status sync across all connected clients

### Email Notifications
- Automated HTML email on policy creation
- Includes: Customer Name, Policy Number, Vehicle, Insurer, Premium, Status
- Download link valid for 24 hours

### Activity Logging
All actions logged to `activity_logs` table:
- Policy upload, status change, delete, download
- User login and logout

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns accessToken |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Required | Logout, clear cookie |
| GET | `/api/auth/me` | Required | Get current user |
| POST | `/api/auth/register` | Admin | Create new user |

### Policies
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/policies` | Required | List policies (search, filter, paginate) |
| GET | `/api/policies/summary` | Required | Dashboard summary counts |
| GET | `/api/policies/:id` | Required | Get single policy |
| GET | `/api/policies/:id/download` | Required | Get presigned download URL |
| POST | `/api/policies/upload` | Required | Upload PDF, trigger extraction |
| PATCH | `/api/policies/:id/status` | Admin | Update policy status |
| DELETE | `/api/policies/:id` | Admin | Soft delete policy |
| GET | `/api/policies/export/csv` | Admin | Export all policies as CSV |

---

## Roles & Permissions

| Action | Admin | Ops |
|---|---|---|
| View dashboard | ✅ | ✅ |
| Upload policy | ✅ | ✅ |
| View policy details | ✅ | ✅ |
| Download PDF | ✅ | ✅ |
| Update status | ✅ | ❌ |
| Delete policy | ✅ | ❌ |
| Export CSV | ✅ | ❌ |
| Register new user | ✅ | ❌ |

---

## AWS S3 Setup

1. Create an S3 bucket (e.g., `nicsan-crm-policies`)
2. Create an IAM user with `s3:PutObject` and `s3:GetObject` permissions
3. Add credentials to `.env`:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=nicsan-crm-policies
```

4. (Optional) Enable CORS on the bucket for direct browser access.

**Without AWS credentials**, the app automatically falls back to local filesystem storage at `backend/uploads/` and serves files at `/api/files/`.

---

## Project Structure (Files)

### Backend — 24 source files
```
backend/
├── config/
│   ├── db.js           # PostgreSQL connection pool
│   ├── s3.js           # S3 upload + presigned URL (mock mode supported)
│   ├── socket.js       # Socket.IO server initialization
│   └── mailer.js       # Nodemailer SMTP transporter
├── controllers/
│   ├── authController.js     # Auth handlers + validation
│   └── policyController.js   # Policy CRUD + CSV export
├── middleware/
│   ├── authMiddleware.js     # JWT Bearer token verification
│   ├── roleMiddleware.js     # Role-based access control
│   ├── uploadMiddleware.js   # Multer file upload (5MB PDF only)
│   └── errorMiddleware.js    # Global error handler
├── repositories/
│   ├── policyRepository.js   # SQL queries + activity logs
│   └── userRepository.js    # User CRUD
├── routes/
│   ├── auth.routes.js        # Auth route definitions
│   └── policy.routes.js      # Policy route definitions
├── services/
│   ├── authService.js        # Login, register, refresh, logout
│   ├── policyService.js      # Upload, status, delete, download, export
│   ├── extractionService.js   # PDF parse + GPT-4o-mini extraction
│   └── emailService.js       # HTML policy notification email
├── utils/
│   ├── jwtUtils.js           # JWT sign/verify (access + refresh)
│   ├── logger.js             # Timestamped console logging
│   └── responseUtils.js      # Standardized API response helpers
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_policies.sql
│   ├── 003_create_activity_logs.sql
│   └── 004_shared_trigger.sql
├── seed.js              # Seed admin + ops users
└── server.js            # Express entry point
```

### Frontend — 20 source files
```
frontend/src/
├── components/
│   ├── AppShell.tsx             # Sidebar layout + navigation
│   ├── ExtractionConfidencePanel.tsx
│   ├── PolicyTable.tsx         # Paginated table with search/filter
│   ├── ProtectedRoute.tsx       # Auth guard + role guard
│   ├── SummaryCards.tsx        # Dashboard metric cards
│   └── UploadZone.tsx          # Drag-and-drop upload
├── context/
│   └── AuthContext.tsx          # Auth state management
├── hooks/
│   └── useSocket.ts             # Socket.IO connection hook
├── pages/
│   ├── Login.tsx                # Login form
│   ├── Dashboard.tsx            # Policy list + summary
│   ├── PolicyDetail.tsx         # Full policy view + status management
│   └── Upload.tsx                # PDF upload + live extraction display
├── services/
│   └── api.ts                   # Axios client + interceptors
└── types/
    ├── api.types.ts             # API response types
    ├── policy.types.ts          # Policy, summary, filters interfaces
    └── user.types.ts            # User + role types
```

---

## Scoring Criteria (as per assignment)

| Criteria | Weight |
|---|---|
| Code Quality | 25% |
| Architecture & Folder Structure | 15% |
| Frontend Implementation | 15% |
| Backend API Design | 15% |
| Database Design | 10% |
| Authentication & Security | 10% |
| AWS & Email Integration | 5% |
| Real-time Features & Documentation | 5% |
| **Total** | **100%** |

---

## Environment Variables Reference

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nicsan_crm

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 (leave blank for local mock mode)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=

# OpenAI (required for PDF extraction)
OPENAI_API_KEY=sk-

# SMTP / Email (leave blank to skip email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## Scripts

```bash
# Backend
cd backend
npm run start        # Start production server
npm run dev          # Start with --watch (auto-restart on changes)
npm run seed         # Run user seeder
npm run migrate      # Run all migrations

# Frontend
cd frontend
npm run dev          # Start dev server (port 3000)
npm run build         # TypeScript check + production build
npm run preview       # Preview production build
npm run lint          # ESLint
```