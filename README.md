# UCE Scholarship Management System

<p align="center">
  <img src="client/public/images/logo-uce.png" alt="UCE logo" width="96" />
  <br />
  <strong>UCE Scholarship Management System</strong>
  <br />
  <em>A modern client-first application for managing university scholarships (React + Supabase)</em>
</p>

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/built%20with-React-61DBFB.svg?logo=react)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/backend-Supabase-3ECF8E.svg?logo=supabase)](https://supabase.com)

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

#### Backend (Supabase - Headless)

- **Database**: PostgreSQL (managed by Supabase)
- **Authentication**: Supabase Auth with UUID-based user IDs
- **File Storage**: Supabase Storage (AWS S3-compatible)
- **Business Logic**: Client-side Supabase services (direct queries + RLS)
- **Real-Time Subscriptions**: WebSocket-based live updates
- **Row-Level Security**: Fine-grained data access policies

#### Infrastructure

- **Containerization**: Docker (client-only, lightweight)
- **Web Server**: Nginx (serving React SPA)
- **Cloud Platform**: AWS (EC2 for compute)
- **Deployment**: Docker Compose (single service)

---

## 📁 Project Structure

```
uce-scholarship-system/
├── client/                           # React Frontend (SPA)
│   ├── src/
│   │   ├── components/              # Atomic Design (atoms, molecules, organisms)
│   │   ├── pages/                   # Page components (admin, student, guest)
│   │   ├── context/                 # React Context (Auth, Admin)
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # Supabase services & utilities
│   │   │   ├── supabaseClient.js   # Supabase client initialization
│   │   │   └── supabaseAuthService.js # Auth & staff management
│   │   ├── utils/                   # Utility functions (logger, PDF generation)
│   │   ├── schemas/                 # Validation schemas (Yup/Zod)
│   │   ├── config/                  # Configuration files
│   │   └── assets/                  # Static assets
│   ├── nginx/
│   │   └── default.conf            # Nginx SPA routing config
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml               # Docker compose (client only)
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
└── README.md                        # This file
```

---

## 📸 Screenshots & Images

Place project images inside the `imagenes/` folder. Recommended subfolders:

```
imagenes/
├── screenshots/   # login, dashboard, admin pages
├── diagrams/      # architecture diagrams
└── logos/         # project logos
```

Examples to include images in this README:

```markdown
<!-- Use the logo bundled in the client as example -->

![UCE Logo](client/public/images/logo-uce.png)

<!-- Placeholder screenshots - replace with your files under imagenes/screenshots/ -->

![Login screen](imagenes/screenshots/login.png)
![Dashboard](imagenes/screenshots/dashboard.png)
```

When you upload the images to `imagenes/`, I can insert them into the README in the appropriate sections (Login, Admin, Dashboard, Architecture).

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
- Docker & Docker Compose (for production)
- Supabase project with configured tables and RLS policies
- Environment variables (see .env.example)

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/JessielCH/uce-scholarship-system.git
cd uce-scholarship-system

# Install dependencies (client only)
cd client
npm install

# Configure environment
cd ..
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Start development server
cd client
npm run dev
# Frontend will be available at http://localhost:5173
```

### Production Deployment with Docker

```bash
# Build and deploy (client-only)
docker-compose up --build -d

# View logs
docker-compose logs -f client

# Access via http://localhost or your AWS domain
```

---

## � Data Layer

All database operations go directly from the React client to Supabase, secured by:

- **Row-Level Security (RLS)**: Fine-grained access control at database level
- **Supabase Auth**: Token-based authentication
- **Service Methods**: `client/src/services/supabaseAuthService.js` for core operations:
  - `verifyStudent(email)` - Check if email is scholarship student
  - `createStaff(email, password, fullName, role)` - Create staff/admin users

No intermediary Node.js API layer—all business logic in React using Supabase client library.

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

- Supabase admin operations (like `auth.admin.createUser()`) require proper RLS and auth permissions configured
- Real-time subscriptions depend on Supabase WebSocket availability
- PDF generation has limited font support
- Client-side storage limited to browser's localStorage/IndexedDB

---

## 📚 Architecture Decision: Client-Only vs Full-Stack

**Why we removed the Node.js backend:**

✅ **Simpler deployment** - One container instead of two  
✅ **Lower latency** - Direct client-to-Supabase queries  
✅ **Easier scaling** - No backend server memory/CPU overhead  
✅ **Type safety potential** - Supabase auto-generates TypeScript types  
✅ **Cost reduction** - Fewer AWS resources needed

⚠️ **Trade-offs:**

- Complex multi-step operations need to be handled client-side
- Cannot hide Supabase keys server-side (use only anon key for public ops)
- Validation logic duplicated between client and database RLS

---

## 📄 License

Proprietary software for Universidad Central del Ecuador.
All rights reserved. Unauthorized copying is prohibited.

---

**Last Updated**: February 2026  
**Version**: 2.0.0 (Client-Only Architecture)  
**Main Technologies**: React 18, Supabase, PostgreSQL, Docker, AWS, Nginx

For support, issues, or contributions, please contact the development team.
