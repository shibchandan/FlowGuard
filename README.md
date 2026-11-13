# FlowGuard – Configurable Workflow Decision Platform

**FlowGuard** is a robust, configuration-driven workflow decision platform designed to automate business processes using dynamic business rules, structured workflows, transactional lifecycle state management, failure simulation and recovery, manual reviews, and complete explainable audit history.

Developed for the Full Stack Developer recruitment assignment at **ScoreMe**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Capabilities & Features](#2-key-capabilities--features)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Prerequisites](#5-prerequisites)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Setup, Migrations & Seeding](#8-database-setup-migrations--seeding)
9. [Running the Application](#9-running-the-application)
10. [Automated Testing](#10-automated-testing)
11. [Demo Accounts & Scenarios](#11-demo-accounts--scenarios)
12. [API Reference & OpenAPI](#12-api-reference--openapi)
13. [Example Workflow Configuration](#13-example-workflow-configuration)
14. [Design Decisions & Trade-offs](#14-design-decisions--trade-offs)
15. [Known Limitations](#15-known-limitations)

---

## 1. Project Overview

Organizations frequently handle approval and verification processes (such as loan applications, credit approvals, vendor onboarding, or claim settlements) through rigid software systems with hardcoded thresholds or manual spreadsheets. 

**FlowGuard** solves these challenges by decoupling workflow rules from code into dynamic, versioned configurations:
- **Zero hardcoded business rules**: Workflows define rules, mandatory fields, thresholds, failure actions, and retries in versioned JSON configurations.
- **Explainable automated decisions**: Every evaluated condition records field values, operators, expected thresholds, and pass/fail reasons.
- **Fault tolerance and recovery**: Built-in dependency failure simulator with configurable retry limits and attempt history tracking.
- **Duplicate prevention**: Strict idempotency using database unique constraints preventing race conditions or duplicate execution runs.
- **Human-in-the-loop**: Borderline requests automatically route to a dedicated reviewer queue with reviewer attribution.

---

## 2. Key Capabilities & Features

### 2.1 Role-Based Access Control (RBAC)
Four distinct roles enforced strictly server-side:
- **`ADMIN`**: Create and publish workflows, edit draft versions, configure dependency simulator, submit requests, trigger retries, and review cases.
- **`OPERATOR`**: Submit business requests, track request execution lifecycle, and trigger retries on failed executions.
- **`REVIEWER`**: Inspect pending manual reviews, examine rule evaluation traces, and submit approval/rejection decisions with notes.
- **`VIEWER`**: Read-only access to dashboard statistics, requests, and audit logs.

### 2.2 Configurable Rule Engine
A safe, deterministic rule engine that evaluates rules without arbitrary code execution (`eval()` or `Function()` are strictly banned):
- Supported operators: `EQUALS`, `NOT_EQUALS`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`, `EXISTS`, `NOT_EXISTS`.
- Priority-ordered evaluation.
- Configurable failure actions: `REJECT` or `MANUAL_REVIEW`.
- Generates a granular trace explaining every single rule evaluated.

### 2.3 Immutable Workflow Versioning
- Workflows are defined with draft iterations.
- Publishing validates the configuration and generates an immutable version number (v1, v2, ...).
- Existing executions remain pinned to the exact version under which they were created.

### 2.4 Idempotency & Concurrency Safety
- Clients pass an `Idempotency-Key` header with requests.
- Deterministic SHA-256 payload hashing checks key reuse:
  - Same key + same payload: returns existing execution result (HTTP 200).
  - Same key + different payload: rejects with HTTP 409 Conflict.
- Backed by PostgreSQL unique constraints to prevent concurrent duplicate submissions.

### 2.5 External Dependency Simulator & Retries
- Internal simulator supporting `SUCCESS`, `TEMPORARY_FAILURE` (timeout), and `PERMANENT_FAILURE`.
- Executions experiencing temporary failures transition to `RETRYING`.
- Operators can trigger retries which record attempt numbers, reasons, and execution history up to configured `maxRetries`.

### 2.6 Complete Audit Trail
- Chronological append-only audit log tracking every submission, validation, decision, transition, retry, and review.

---

## 3. Technology Stack

### Backend
- **Runtime**: Node.js v20+ / TypeScript 5.7+
- **Framework**: Express.js 4.x
- **Database & ORM**: PostgreSQL 16 + Prisma ORM 5.x
- **Validation**: Zod runtime schema validation
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing (10 rounds)
- **Logging**: Pino & pino-http structured logging
- **Testing**: Vitest, Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Tooling**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Server State**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Icons & Visuals**: Lucide React, Recharts

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Configuration**: Dotenv environment variables

---

## 4. System Architecture

FlowGuard uses a **Modular Monolith Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│   Dashboard │ Requests │ Workflows │ Reviews │ Audit Logs   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST APIs (/api/v1)
┌──────────────────────────────▼──────────────────────────────┐
│                  Express.js API Layer (TypeScript)          │
│   Auth Middleware │ Role Guard │ Validation │ Error Handler │
├─────────────────────────────────────────────────────────────┤
│                     Application Services                    │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │     Request Service     │   │     Workflow Service     │ │
│  └────────────┬────────────┘   └─────────────┬────────────┘ │
│               ▼                              ▼              │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │    Execution Engine     ├───►    Rules Engine (Safe)   │ │
│  └────────────┬────────────┘   └──────────────────────────┘ │
│               │                                             │
│       ┌───────┴───────────────┬───────────────┐             │
│       ▼                       ▼               ▼             │
│  ┌───────────┐         ┌────────────┐   ┌────────────┐      │
│  │Idempotency│         │ Simulator  │   │   Audit    │      │
│  │  Manager  │         │  & Retry   │   │  Logging   │      │
│  └─────┬─────┘         └─────┬──────┘   └─────┬──────┘      │
├────────┴─────────────────────┴────────────────┴─────────────┤
│                 Prisma Data Access Layer                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL 16 Database                   │
│ Requests │ Executions │ Versions │ AuditLogs │ Reviews │... │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Prerequisites

Before running the application locally, ensure you have:
- **Node.js**: `v20.x` or higher (tested on Node v24)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v14+` running locally or accessible via URL (or Docker)
- **Git**

---

## 6. Installation & Setup

Clone the repository and set up environment files:

```bash
# Clone repository
git clone https://github.com/scoreme/flowguard.git
cd FlowGuard

# Copy environment template
cp .env.example .env
cp backend/.env.example backend/.env
```

### Install Backend Dependencies
```bash
cd backend
npm install
```

### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 7. Environment Configuration

The primary `.env` file contains:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowguard
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowguard_test

# Authentication
JWT_SECRET=flowguard-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Workflow Engine Defaults
MAX_RETRIES=3
```

---

## 8. Database Setup, Migrations & Seeding

Run Prisma migrations and seed the database with initial users and the Application Approval workflow:

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Run Database Migrations
npm run db:migrate

# Seed Demo Users and Workflows
npm run db:seed
```

---

## 9. Running the Application

### Option A: Running with npm (Recommended for Local Dev)

In terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server starts on http://localhost:3000
# Health check: http://localhost:3000/api/v1/health
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Frontend dashboard starts on http://localhost:5173
```

### Option B: Running with Docker Compose

If Docker is available:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/v1`
- PostgreSQL: `localhost:5432`

---

## 10. Automated Testing

FlowGuard includes unit tests, state machine tests, idempotency tests, and API integration tests.

```bash
cd backend

# Run all automated tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Suite Summary:
- `ruleEvaluator.test.ts`: Verifies all comparison operators (`GT`, `GTE`, `LT`, `LTE`, `EQUALS`, `NOT_EQUALS`, `IN`, `NOT_IN`, `EXISTS`, `NOT_EXISTS`) and decision routing (`APPROVED`, `REJECTED`, `MANUAL_REVIEW`).
- `stateMachine.test.ts`: Verifies allowed and disallowed request lifecycle transitions.
- `idempotency.test.ts`: Verifies deterministic SHA-256 payload hashing and key uniqueness.
- `auth.test.ts`: Verifies JWT authentication, token validation, and error responses.

---

## 11. Demo Accounts & Scenarios

The seed script creates 4 pre-configured demo accounts:

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin** | `admin@flowguard.local` | `Admin@123` | Full access (workflows, simulator, requests, reviews) |
| **Operator** | `operator@flowguard.local` | `Operator@123` | Submit requests, view history, trigger retries |
| **Reviewer** | `reviewer@flowguard.local` | `Reviewer@123` | Inspect pending review queue, approve/reject |
| **Viewer** | `viewer@flowguard.local` | `Viewer@123` | Read-only access to dashboard and requests |

*(Quick-login buttons are provided on the Login page for convenience during evaluation).*

---

### Step-by-Step Demo Scenarios

#### Demo 1: Automated Approval
1. Log in as `operator@flowguard.local`.
2. Go to **New Request** and click **Preset: Approval (Score 780)**.
3. Submit the form.
4. **Result**: Status becomes `APPROVED` / `COMPLETED`.
5. Rule trace shows:
   - Minimum Age (>= 18): **PASS**
   - Minimum Credit Score (>= 600): **PASS**
   - Credit Score Threshold (>= 750): **PASS**
   - Minimum Income (>= 25000): **PASS**
   - External dependency verification: **SUCCESS**

#### Demo 2: Rule Rejection
1. Go to **New Request** and click **Preset: Reject (Score 520)**.
2. Submit the form.
3. **Result**: Status is `REJECTED` / `COMPLETED`.
4. Rule trace highlights `RULE_002` failed with reason: credit score 520 does not satisfy `>= 600`.

#### Demo 3: Manual Review Workflow
1. Go to **New Request** and click **Preset: Review (Score 650)**.
2. Submit the form.
3. **Result**: Request enters `MANUAL_REVIEW` status.
4. Log out and log in as `reviewer@flowguard.local`.
5. Open **Manual Reviews** queue and select the pending case.
6. Enter reviewer comments (e.g. *"Salary slips and tax records verified"*) and click **Approve Request**.
7. **Result**: Request transitions to `APPROVED` -> `COMPLETED` with reviewer audit attribution.

#### Demo 4: Dependency Failure & Retry Recovery
1. Log in as `admin@flowguard.local` and navigate to **Simulator & Settings**.
2. Select **Temporary Failure / Timeout** and click **Activate Mode**.
3. Submit a valid request with credit score 780.
4. **Result**: The external verification times out; request enters `RETRYING` status with execution status `RETRY`.
5. Return to **Simulator & Settings** and switch mode back to **Normal Success**.
6. Open the failed request details and click **Retry Execution**.
7. **Result**: Attempt #2 succeeds, state updates to `APPROVED` -> `COMPLETED`, and full retry history is preserved.

#### Demo 5: Idempotency & Duplicate Prevention
1. Submit a request with a fixed `Idempotency-Key` (e.g. `idem-fixed-test-key`).
2. Submit the same request payload again with the exact same key.
3. **Result**: The server returns HTTP 200 with the existing request without creating a duplicate record or re-evaluating rules.
4. Submit a *different* payload using the same key -> returns **HTTP 409 Conflict**.

#### Demo 6: Workflow Version Isolation
1. Submit an application under Version 1.
2. Go to **Workflows**, select **Application Approval Workflow**, and click **Configure Rules**.
3. Modify the threshold (e.g., increase credit score approval to 800) and click **Save & Publish Version**.
4. The workflow now has Version 2 active.
5. Inspect the original request: it remains permanently pinned to Version 1 configuration.
6. Submit a new request: it executes against Version 2.

---

## 12. API Reference & OpenAPI

Base URL: `/api/v1`

### Authentication
- `POST /api/v1/auth/login` – Authenticate user and receive JWT
- `GET /api/v1/auth/me` – Retrieve current user profile

### Dashboard
- `GET /api/v1/dashboard/summary` – Summary metrics (total, approved, rejected, reviews, retrying, failed)
- `GET /api/v1/dashboard/activity` – Paginated recent activity log

### Workflows
- `GET /api/v1/workflows` – List workflows with pagination and search
- `POST /api/v1/workflows` – Create new workflow definition (`ADMIN`)
- `GET /api/v1/workflows/:id` – Retrieve workflow details and versions
- `PUT /api/v1/workflows/:id` – Update workflow metadata (`ADMIN`)
- `GET /api/v1/workflows/:id/versions` – List version history
- `POST /api/v1/workflows/:id/versions` – Create new draft version (`ADMIN`)
- `POST /api/v1/workflows/:id/versions/:versionId/publish` – Publish version (`ADMIN`)

### Requests
- `POST /api/v1/requests` – Submit structured business request (supports `Idempotency-Key` header)
- `GET /api/v1/requests` – List requests with pagination and status/date filters
- `GET /api/v1/requests/:id` – Detailed request view with execution and rule trace
- `GET /api/v1/requests/:id/history` – Complete lifecycle state transitions

### Executions
- `GET /api/v1/executions` – List executions
- `GET /api/v1/executions/:id` – Execution details with rule trace
- `GET /api/v1/executions/:id/audit` – Execution audit trail
- `POST /api/v1/executions/:id/retry` – Trigger retry on eligible execution (`ADMIN`, `OPERATOR`)

### Manual Reviews
- `GET /api/v1/reviews` – List pending review tasks (`ADMIN`, `REVIEWER`)
- `GET /api/v1/reviews/:id` – View review case details
- `POST /api/v1/reviews/:id/decision` – Submit approval or rejection decision (`ADMIN`, `REVIEWER`)

### Audit Logs
- `GET /api/v1/audit` – Paginated query of immutable audit events

### Dependency Simulator
- `GET /api/v1/admin/simulator` – Get active simulation mode (`ADMIN`)
- `PUT /api/v1/admin/simulator` – Set mode (`SUCCESS`, `TEMPORARY_FAILURE`, `PERMANENT_FAILURE`) (`ADMIN`)

### Health Check
- `GET /api/v1/health` – Public health check and database connectivity probe

---

## 13. Example Workflow Configuration

```json
{
  "inputSchema": {
    "applicantName": "string",
    "email": "string",
    "age": "number",
    "creditScore": "number",
    "monthlyIncome": "number",
    "requestedAmount": "number"
  },
  "rules": [
    {
      "id": "RULE_001",
      "name": "Minimum Age",
      "field": "age",
      "operator": "GTE",
      "value": 18,
      "priority": 1,
      "failureAction": "REJECT",
      "isActive": true
    },
    {
      "id": "RULE_002",
      "name": "Minimum Credit Score (Hard Reject)",
      "field": "creditScore",
      "operator": "GTE",
      "value": 600,
      "priority": 2,
      "failureAction": "REJECT",
      "isActive": true
    },
    {
      "id": "RULE_003",
      "name": "Credit Score Auto-Approval Threshold",
      "field": "creditScore",
      "operator": "GTE",
      "value": 750,
      "priority": 3,
      "failureAction": "MANUAL_REVIEW",
      "isActive": true
    },
    {
      "id": "RULE_004",
      "name": "Minimum Monthly Income",
      "field": "monthlyIncome",
      "operator": "GTE",
      "value": 25000,
      "priority": 4,
      "failureAction": "MANUAL_REVIEW",
      "isActive": true
    }
  ],
  "execution": {
    "maxRetries": 3
  }
}
```

---

## 14. Design Decisions & Trade-offs

1. **Modular Monolith vs Microservices**: A modular monolith was selected to avoid distributed transaction overhead, network latency, and deployment complexity during recruitment evaluation while preserving clean domain boundaries.
2. **Relational Schema + JSONB**: Structured relational tables store lifecycle status, users, timestamps, and indexes, while JSONB is used for flexible workflow rule sets and variable request input schemas.
3. **Pure Function Rule Evaluator**: Rule evaluation is side-effect-free, deterministic, and isolated from HTTP and database layers, making it thoroughly unit-testable.
4. **Database Constraint Idempotency**: Rather than relying on transient in-memory caches (e.g. Map/Redis), PostgreSQL unique indexes enforce atomic deduplication across concurrent submissions.
5. **Decoupled External Simulator**: Third-party verification calls run *outside* database transactions to prevent connection pool exhaustion and long-running database locks.

---

## 15. Known Limitations

- The initial implementation executes workflow evaluations synchronously within the request lifecycle. Future production iterations can introduce BullMQ / Redis for asynchronous worker queues.
- Real third-party banking/credit bureau integrations are simulated internally for deterministic reproducibility.

---

*FlowGuard – ScoreMe Full Stack Recruitment Project*
