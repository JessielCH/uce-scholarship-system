# UCE Scholarship Management System

> A comprehensive full-stack web application for managing university scholarship programs with real-time updates, document management, and advanced analytics dashboards.

## 📋 Overview

The UCE Scholarship Management System is designed to streamline scholarship distribution at Universidad Central del Ecuador (UCE). It provides role-based access control, real-time document management, payment tracking, and audit logging for complete transparency and compliance.

### Key Features

- **Role-Based Access Control**: Admin, Staff, and Student roles with granular permissions
- **Intelligent Scholarship Selection**: Top 10% algorithm for selecting high-performing students
- **Real-Time Document Management**: Upload, validate, and reject documents with instant notifications
- **Payment Lifecycle Tracking**: Complete workflow from selection to disbursement
- **Live Analytics Dashboards**: Real-time metrics and visualizations
- **Comprehensive Audit Trail**: Full logging for compliance and transparency
- **Multi-Period Support**: Handle multiple academic periods with historical data preservation
- **Google OAuth Integration**: Seamless authentication via Google
- **Automated Notifications**: Email alerts for status changes and important deadlines

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with Vite (ultra-fast build)
- **Styling**: Tailwind CSS + PostCSS for responsive design
- **State Management**: TanStack React Query (data fetching, caching, synchronization)
- **Authentication**: Supabase Auth (JWT + session-based)
- **Real-Time**: Supabase Realtime (WebSocket subscriptions)
- **Form Validation**: Formik + Yup schema validation
- **PDF Generation**: PDFKit for contracts and receipts
- **Build Tool**: Vite with hot module replacement

#### Backend
- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL (managed by Supabase)
- **File Storage**: Supabase Storage (AWS S3-compatible)
- **Email**: Nodemailer with SMTP integration
- **Algorithm**: Custom scholarship selection (10% threshold)
- **Logging**: Custom logger utility with severity levels

#### Database (PostgreSQL via Supabase)
- **Authentication**: Supabase Auth with UUID-based user IDs
- **RLS Policies**: Fine-grained row-level security for data access
- **Core Tables**: profiles, students, academic_periods, careers, scholarship_selections, documents, audit_logs

#### DevOps & Infrastructure
- **Containerization**: Docker (multi-stage builds)
- **Orchestration**: Docker Compose
- **Cloud Platform**: AWS (EC2 for compute)
- **Reverse Proxy**: Nginx for request routing
- **SSL/TLS**: HTTPS with certificate management

---

## 📁 Project Structure

```
uce-scholarship-system/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/     # Atomic Design (atoms, molecules, organisms)
│   │   ├── pages/          # Page components (admin, student, guest)
│   │   ├── context/        # React Context (Auth, Admin)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # APIs & external services
│   │   ├── utils/          # Utility functions
│   │   ├── schemas/        # Validation schemas
│   │   ├── config/         # Configuration files
│   │   └── assets/         # Static assets
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
│
├── server/                  # Node.js/Express Backend
│   ├── config/             # Supabase configuration
│   ├── middleware/         # Logging middleware
│   ├── utils/              # Algorithms & helpers
│   ├── index.js            # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Docker orchestration
├── .env.example            # Environment template
└── README.md               # This file
```

---

## 🔐 Security & Access Control

### Row-Level Security (RLS)
All database queries enforce RLS policies:
- **Students**: Only their own data
- **Staff**: Assigned period data
- **Admin**: Full unrestricted access

### Authentication
```
User → Google OAuth 2.0 → Supabase Auth → JWT Token → Protected Routes
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Supabase project
- SMTP credentials

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/JessielCH/uce-scholarship-system.git
cd uce-scholarship-system

# Install dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development servers
# Terminal 1 - Frontend
cd client && npm run dev

# Terminal 2 - Backend
cd server && npm run dev
```

### Production Deployment with Docker

```bash
# Build and deploy all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Access via http://localhost or AWS domain
```

---

## 📡 API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/verify-student` - Verify session
- `POST /api/admin/create-staff` - Create staff
- `GET /api/scholarships` - List scholarships
- `PUT /api/scholarships/:id/status` - Update status
- `POST /api/documents/upload` - Upload document

---

## 🔄 Real-Time Features

Uses Supabase Realtime subscriptions for:
- Document upload notifications
- Instant status updates
- Live dashboard metrics refresh
- Email alerts on important events

---

## 📊 Scholarship Selection Workflow

```
Registration → Active Period → Selection Algorithm (Top 10%)
→ Document Upload → Admin Review → Contract Generation
→ Payment Processing → Disbursement (PAID)
```

---

## 📝 Code Conventions

- **Components**: PascalCase (`Button`, `ScholarshipCard`)
- **Functions**: camelCase (`fetchScholarships`, `handleUpload`)
- **Constants**: UPPER_SNAKE_CASE (`ITEMS_PER_PAGE`, `API_BASE_URL`)
- **Comments**: English language with emoji prefixes (🔍, ✅, ❌, ⚠️)

---

## 🧪 Quality Assurance

- **Linting**: ESLint for code consistency
- **Validation**: Formik + Yup for forms
- **Performance**: TanStack Query with caching strategies
- **Security**: SQL injection prevention, CORS configuration, RLS enforcement

---

## 🐛 Known Limitations

- Google OAuth requires matching redirect URLs in AWS
- PDF generation has limited font support
- CORS must match production domain names

---

## 📄 License

Proprietary software for Universidad Central del Ecuador.
All rights reserved. Unauthorized copying is prohibited.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Main Technologies**: React 18, Node.js, PostgreSQL, Supabase, Docker, AWS

For support, issues, or contributions, please contact the development team.
