# FlowGuard – Technical Project Report & Architectural Submission

**Project Name**: FlowGuard – Configurable Workflow Decision Platform  
**Target Organization**: ScoreMe Solutions Pvt. Ltd.  
**Drive**: Placement Drive Hackathon (MNNIT Allahabad)  
**Candidate Name**: Shib Chandan Mistry  
**Institute**: Motilal Nehru National Institute of Technology (MNNIT) Allahabad  
**GitHub Repository**: [https://github.com/shibchandan/FlowGuard](https://github.com/shibchandan/FlowGuard)  
**Date**: November 13, 2026  

---

## Executive Summary

**FlowGuard** is a configuration-driven workflow decision platform designed to automate complex, multi-stage business decisions (such as credit evaluations, loan origination, and vendor compliance) with zero hardcoded business logic. 

Built as a high-performance **Modular Monolith** in **Node.js, Express, TypeScript, and React 18**, FlowGuard decouples policy definitions into versioned, immutable JSON configurations, executes deterministic rule evaluations without arbitrary code execution (`eval()` or `Function()` are strictly banned), coordinates transactional state machine lifecycles, guarantees request idempotency through database-level constraints, simulates downstream dependency fault recovery, and provides human-in-the-loop manual review queues.

Every decision generates a fully explainable, append-only audit trace documenting the exact input values, comparison operators, configured thresholds, pass/fail results, and execution timestamps.

The platform achieves a **100% pass rate** across all 27 automated unit and integration tests and is backed by a serverless cloud PostgreSQL database with connection pooling and direct migration channels.

---

## Table of Contents

1. [Problem Statement & Recruitment Assignment Objectives](#1-problem-statement--recruitment-assignment-objectives)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Backend Modular Monolith Architecture](#3-backend-modular-monolith-architecture)
4. [Database Architecture & Entity Relationship Model](#4-database-architecture--entity-relationship-model)
5. [State Machine Lifecycle & Transitions](#5-state-machine-lifecycle--transitions)
6. [Safe Configurable Rule Engine Design](#6-safe-configurable-rule-engine-design)
7. [Idempotency & Concurrency Safety](#7-idempotency--concurrency-safety)
8. [Dependency Simulator & Fault Recovery Mechanism](#8-dependency-simulator--fault-recovery-mechanism)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Frontend Architecture & Dashboard System](#10-frontend-architecture--dashboard-system)
11. [Automated Test Suite & Quality Assurance](#11-automated-test-suite--quality-assurance)
12. [Security, Performance & Architectural Decisions](#12-security-performance--architectural-decisions)
13. [Step-by-Step Evaluator Walkthrough Guide](#13-step-by-step-evaluator-walkthrough-guide)
14. [Submission Details & Verification](#14-submission-details--verification)

---

## 1. Problem Statement & Recruitment Assignment Objectives

Organizations managing sensitive approval flows (such as loan approvals, merchant underwriting, or insurance verification) frequently face operational challenges with legacy systems:
1. **Rigid Hardcoded Rules**: Simple threshold adjustments (e.g., changing minimum credit score from 750 to 780) require codebase modifications, test cycles, and production redeployments.
2. **Black-Box Decisions**: Rejected applicants or compliance officers cannot see which specific rule failed or what values triggered the decision.
3. **Double Execution Vulnerabilities**: Flaky network connections or multiple user clicks can result in duplicate requests being processed simultaneously.
4. **Third-Party Dependency Brittleness**: Temporary downtime in external credit rating bureaus or KYC services results in lost requests rather than controlled, audited retries.
5. **No Audit Version Control**: Regulatory inquiries cannot determine which exact workflow rule version was in effect when a decision was executed months prior.

### ScoreMe Recruitment Requirements Implemented:
- **100% Configurable Rules**: No business logic is hardcoded. Rules, schemas, and thresholds reside in JSON configurations.
- **Strict Version Immutability**: Published workflow versions cannot be modified; in-flight executions remain permanently pinned to their origin version.
- **ACID Transactional State Machine**: Status transitions are linear, validated, and logged to an append-only audit trail.
- **Cryptographic Idempotency**: SHA-256 payload hashing enforced by PostgreSQL composite unique indexes.
- **Simulated Dependency & Retry Engine**: Configurable failure simulator (`SUCCESS`, `TEMPORARY_FAILURE`, `PERMANENT_FAILURE`) with retry limits and history.
- **Human Review Queue**: Borderline cases route automatically to an authorized reviewer inbox for approval or rejection.

---

## 2. High-Level System Architecture

FlowGuard is architected as a **Modular Monolith** to maximize throughput, ensure transaction atomicity, and maintain clean domain boundaries without the network latency and distributed transaction complexity of microservices.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│                      React 18 + TypeScript + Vite + Tailwind CSS                       │
│     [Dashboard]      [Workflows]      [Requests]      [Reviews]      [Audit Logs]      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST APIs (/api/v1) + JWT Bearer
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             API GATEWAY & SECURITY MIDDLEWARE                          │
│       Rate Limiting  │  Helmet  │  CORS  │  JWT Auth Guard  │  RBAC Role Guard  │  Zod │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                  CORE APPLICATION SERVICES                             │
│                                                                                        │
│   ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────┐   │
│   │    Request Service     │───►│    Execution Engine    ├───►│  Safe Rule Engine  │   │
│   └────────────────────────┘    └───────────┬────────────┘    └────────────────────┘   │
│                                             │                                          │
│         ┌───────────────────────────────────┼──────────────────────────────────┐       │
│         ▼                                   ▼                                  ▼       │
│   ┌───────────┐                       ┌───────────┐                      ┌───────────┐ │
│   │Idempotency│                       │ Simulator │                      │   Audit   │ │
│   │  Service  │                       │  & Retry  │                      │  Service  │ │
│   └───────────┘                       └───────────┘                      └───────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                  DATA ACCESS LAYER                                     │
│                     Prisma ORM 5.x (Connection Pooler + Direct URL)                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                 PERSISTENCE LAYER                                      │
│                      PostgreSQL 16 on Neon Serverless Cloud                            │
│  [Users]  [Workflows]  [Versions]  [Requests]  [Executions]  [Transitions]  [Audits]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Modular Monolith Architecture

The backend codebase (`backend/src/`) is organized strictly by business domain, separating controllers, services, repositories, and validation schemas:

```
backend/src/
├── config/                  # Environment validation, database client, structured logger
│   ├── env.ts               # Resilient environment loader with type validation
│   ├── database.ts          # Prisma client instantiation with query logging
│   └── logger.ts            # Pino structured logger with development formatting
├── middleware/              # Global request middleware
│   ├── auth.middleware.ts   # JWT token extraction and signature verification
│   ├── role.middleware.ts   # Role-Based Access Control guards
│   ├── validate.middleware.ts# Generic Zod runtime schema validator
│   └── error.middleware.ts  # Standardized JSON error response handler
├── modules/                 # Modular domain services
│   ├── auth/                # Login, JWT issuing, bcrypt password verification
│   ├── workflows/           # Workflow definitions, draft creation, version publishing
│   ├── rules/               # Pure-function rule evaluation engine (10 operators)
│   ├── requests/            # Business request submission, schema check, history
│   ├── executions/          # Execution lifecycle state transitions, rule traces
│   ├── idempotency/         # SHA-256 payload hashing, duplicate checking, conflict handling
│   ├── retry/               # Retry eligibility, attempt counters, retry history
│   ├── reviews/             # Reviewer queue management, decision submissions
│   ├── audit/               # Immutable append-only audit event logging
│   ├── dashboard/           # Summary metrics aggregation and activity feed
│   └── simulator/           # Third-party dependency fault injection simulator
├── shared/                  # Common utilities, enums, response formats, AppError
├── tests/                   # Vitest unit and integration test suites
├── app.ts                   # Express application configuration
└── server.ts                # HTTP server bootstrap and graceful shutdown
```

---

## 4. Database Architecture & Entity Relationship Model

FlowGuard utilizes PostgreSQL for relational integrity and foreign key constraints, combined with native **JSONB** columns for flexible workflow configurations and variable request payloads.

```
 ┌──────────────┐          ┌───────────────────────┐          ┌─────────────────────┐
 │    User      │          │  WorkflowDefinition   │          │   WorkflowVersion   │
 ├──────────────┤ 1      * ├───────────────────────┤ 1      * ├─────────────────────┤
 │ id (PK)      │──────────│ id (PK)               │──────────│ id (PK)             │
 │ email        │          │ name                  │          │ workflowId (FK)     │
 │ passwordHash │          │ code (Unique)         │          │ version (Int)       │
 │ role         │          │ description           │          │ configuration(JSONB)│
 │ isActive     │          │ isActive              │          │ status              │
 └──────────────┘          └───────────────────────┘          └──────────┬──────────┘
        │                                                                │ 1
        │                                                                │
        │ *                                                            * │
 ┌──────┴───────┐          ┌───────────────────────┐          ┌──────────┴──────────┐
 │  AuditLog    │          │        Request        │ 1      1 │  WorkflowExecution  │
 ├──────────────┤          ├───────────────────────┤──────────├─────────────────────┤
 │ id (PK)      │          │ id (PK)               │          │ id (PK)             │
 │ entityType   │          │ referenceNumber (UQ)  │          │ requestId (FK)      │
 │ entityId     │          │ workflowId (FK)       │          │ workflowVersionId   │
 │ action       │          │ status                │          │ status              │
 │ actorId (FK) │          │ inputData (JSONB)     │          │ decision            │
 │ metadata(JSONB)         │ idempotencyKey        │          │ ruleTrace (JSONB)   │
 └──────────────┘          └───────────────────────┘          └──────────┬──────────┘
                                                                         │ 1
                                    ┌────────────────────────────────────┼────────────────┐
                                  * │                                  * │              1 │
                           ┌────────┴─────────────┐           ┌──────────┴────────┐   ┌───┴──────────┐
                           │   StateTransition    │           │    RetryRecord    │   │ ManualReview │
                           ├──────────────────────┤           ├───────────────────┤   ├──────────────┤
                           │ id (PK)              │           │ id (PK)           │   │ id (PK)      │
                           │ requestId (FK)       │           │ executionId (FK)  │   │ requestId(FK)│
                           │ fromStatus           │           │ attemptNumber     │   │ reviewStatus │
                           │ toStatus             │           │ reason            │   │ assignedTo   │
                           │ reason               │           │ status            │   │ reviewerComm.│
                           └──────────────────────┘           └───────────────────┘   └──────────────┘
```

### Table Definitions & Constraints:

| Table | Purpose | Primary Keys & Constraints |
|---|---|---|
| `User` | Operator, Reviewer, and Admin accounts | `id (UUID PK)`, `email (Unique)` |
| `WorkflowDefinition` | Parent workflow identity | `id (UUID PK)`, `code (Unique)` |
| `WorkflowVersion` | Immutable versioned rule configurations | `id (UUID PK)`, `UNIQUE(workflowId, version)` |
| `Request` | Ingested business applications | `id (UUID PK)`, `referenceNumber (Unique)` |
| `WorkflowExecution` | Execution engine instance | `id (UUID PK)`, `requestId (FK)`, `workflowVersionId (FK)` |
| `StateTransition` | History of lifecycle state changes | `id (UUID PK)`, `requestId (FK)` |
| `IdempotencyRecord` | Request deduplication locks | `id (UUID PK)`, `UNIQUE(workflowId, idempotencyKey)` |
| `RetryRecord` | Execution retry attempts and reasons | `id (UUID PK)`, `executionId (FK)` |
| `ManualReview` | Pending and resolved manual reviews | `id (UUID PK)`, `requestId (FK)` |
| `AuditLog` | Append-only security and operational audit trail | `id (UUID PK)`, indexed on `entityType`, `entityId`, `createdAt` |

---

## 5. State Machine Lifecycle & Transitions

Every request progresses through a strictly validated state machine. Invalid transitions return `400 BAD_REQUEST`.

```
                 ┌───────────────┐
                 │   SUBMITTED   │
                 └───────┬───────┘
                         │ Schema Validated
                         ▼
                 ┌───────────────┐
                 │  VALIDATING   │
                 └───────┬───────┘
                         │ Required fields present
                         ▼
                 ┌───────────────┐
                 │  EVALUATING   │
                 └───────┬───────┘
                         │
      ┌──────────────────┼──────────────────┐
      │ Rules Pass       │ Hard Reject      │ Borderline
      ▼                  ▼                  ▼
┌───────────────┐  ┌───────────┐      ┌───────────────┐
│PENDING_DEPEND.│  │ REJECTED  │      │ MANUAL_REVIEW │
└───────┬───────┘  └─────┬─────┘      └───────┬───────┘
        │                │                    │
   ┌────┴────┐           │                    ├───► Approve: APPROVED
   │         │           │                    └───► Reject:  REJECTED
Success    Timeout       │
   │         │           │
   ▼         ▼           ▼
┌──────┐ ┌────────┐ ┌───────────┐
│APPR. │ │RETRYING│ │ COMPLETED │
└──┬───┘ └───┬────┘ └───────────┘
   │         │
   │         ├───► Retry Limit Exceeded: FAILED
   │         └───► Manual Retry: EVALUATING
   ▼
┌───────────┐
│ COMPLETED │
└───────────┘
```

---

## 6. Safe Configurable Rule Engine Design

### Security Guarantee: Zero `eval()` Policy
Dynamic rule engines often introduce remote code execution risks by using JavaScript `eval()` or `Function()`. FlowGuard's engine is built with pure mathematical functions that validate operands against strict comparison operators.

### Supported Operators:

| Operator | Type | Logic | Example |
|---|---|---|---|
| `EQUALS` | Comparison | `actual === expected` | `"employmentType" EQUALS "SALARIED"` |
| `NOT_EQUALS` | Comparison | `actual !== expected` | `"status" NOT_EQUALS "BLACKLISTED"` |
| `GT` | Numeric | `actual > expected` | `"monthlyIncome" GT 25000` |
| `GTE` | Numeric | `actual >= expected` | `"creditScore" GTE 750` |
| `LT` | Numeric | `actual < expected` | `"debtToIncomeRatio" LT 0.40` |
| `LTE` | Numeric | `actual <= expected` | `"requestedAmount" LTE 1000000` |
| `IN` | Set | `expectedArray.includes(actual)` | `"city" IN ["DELHI", "MUMBAI", "BANGALORE"]` |
| `NOT_IN` | Set | `!expectedArray.includes(actual)` | `"riskCategory" NOT_IN ["HIGH", "SEVERE"]` |
| `EXISTS` | Presence | `actual !== undefined && actual !== null` | `"panNumber" EXISTS true` |
| `NOT_EXISTS` | Absence | `actual === undefined \|\| actual === null` | `"bankruptcyFlag" NOT_EXISTS true` |

### Detailed Evaluation Trace:
Every evaluated condition emits a granular `RuleEvaluationResult`:
```json
{
  "ruleId": "RULE_002",
  "ruleName": "Minimum Credit Score (Hard Reject)",
  "field": "creditScore",
  "operator": "GTE",
  "expectedValue": 600,
  "actualValue": 520,
  "passed": false,
  "message": "Value 520 is not greater than or equal to 600",
  "failureAction": "REJECT"
}
```

---

## 7. Idempotency & Concurrency Safety

1. **Header Identification**: Requests accept an `Idempotency-Key` HTTP header.
2. **Payload Hash**: The server computes a cryptographic `SHA-256` hash of the normalized JSON payload.
3. **Database Uniqueness**: An `IdempotencyRecord` table enforces `UNIQUE(workflowId, idempotencyKey)` at the database constraint level.
4. **Outcomes**:
   - **Identical Key + Identical Payload**: Returns the existing execution record with HTTP **200 OK** without re-running business rules.
   - **Identical Key + Different Payload**: Returns HTTP **409 Conflict** (`IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH`).
   - **Concurrent Duplicate Requests**: PostgreSQL unique index constraint throws a unique key violation; the second request catches the error and safely returns the existing record.

---

## 8. Dependency Simulator & Fault Recovery Mechanism

FlowGuard includes an internal configurable external dependency simulator to replicate third-party integrations (e.g. credit rating agencies or identity verification APIs):

### Configurable Modes:
- **`SUCCESS`**: Downstream dependency returns HTTP 200 with verification ID.
- **`TEMPORARY_FAILURE` / `TIMEOUT`**: Downstream dependency times out. The execution transitions to `RETRYING`.
- **`PERMANENT_FAILURE`**: Downstream dependency rejects the request permanently. The execution transitions to `FAILED`.

### Safe Execution & Retries:
- Third-party network calls are executed **outside database transactions** to prevent connection pool exhaustion and long-running locks.
- Executions in `RETRYING` or `FAILED` status can be retried via `POST /api/v1/executions/:id/retry` as long as `attemptNumber < maxRetries` (default: 3).
- Every attempt records a `RetryRecord` with timestamp and actor attribution.

---

## 9. Role-Based Access Control (RBAC)

| Capability / Resource | ADMIN | OPERATOR | REVIEWER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| **Dashboard Metrics & Charts** | ✅ | ✅ | ✅ | ✅ |
| **List Workflows & Requests** | ✅ | ✅ | ✅ | ✅ |
| **Submit Requests** | ✅ | ✅ | ❌ | ❌ |
| **View Execution Rule Traces** | ✅ | ✅ | ✅ | ✅ |
| **Trigger Execution Retries** | ✅ | ✅ | ❌ | ❌ |
| **View Manual Reviews Queue** | ✅ | ❌ | ✅ | ❌ |
| **Approve / Reject Reviews** | ✅ | ❌ | ✅ | ❌ |
| **Create & Edit Workflows** | ✅ | ❌ | ❌ | ❌ |
| **Publish Workflow Versions** | ✅ | ❌ | ❌ | ❌ |
| **Configure Simulator Mode** | ✅ | ❌ | ❌ | ❌ |
| **View Audit Log History** | ✅ | ✅ | ✅ | ✅ |

---

## 10. Frontend Architecture & Dashboard System

The user interface is built with **React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts**:

### Views & Capabilities:
1. **Authentication** ([`Login.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/Login.tsx)): Dynamic login form with one-click demo login buttons for all 4 roles.
2. **Dashboard** ([`Dashboard.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/Dashboard.tsx)): Live aggregate metrics, Recharts status distribution charts, and recent activity feed.
3. **Workflow Management** ([`Workflows.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/Workflows.tsx)): Visual rule editor, threshold modifier, and version publishing.
4. **New Request Submission** ([`NewRequest.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/NewRequest.tsx)): Dynamic validation with one-click presets for **Approval**, **Rejection**, and **Manual Review**.
5. **Execution Tracing** ([`RequestDetails.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/RequestDetails.tsx)): Lifecycle progression timeline, pass/fail rule badges, expected vs actual values, and one-click retry triggers.
6. **Manual Reviews Queue** ([`Reviews.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/Reviews.tsx)): Reviewer inbox with applicant details, rule trace breakdown, and decision modal.
7. **Audit Logs** ([`AuditLogs.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/AuditLogs.tsx)): Searchable, filterable audit event ledger.
8. **Simulator & Settings** ([`Settings.tsx`](https://github.com/shibchandan/FlowGuard/blob/main/frontend/src/pages/Settings.tsx)): Real-time dependency simulation controls.

---

## 11. Automated Test Suite & Quality Assurance

FlowGuard includes unit, state machine, idempotency, and API integration tests executed via Vitest:

```text
 RUN  v2.1.9 D:/FlowGuard/backend

 ✓ src/tests/unit/stateMachine.test.ts (3 tests) 9ms
 ✓ src/tests/unit/ruleEvaluator.test.ts (17 tests) 21ms
 ✓ src/tests/unit/idempotency.test.ts (3 tests) 9ms
 ✓ src/tests/integration/auth.test.ts (4 tests) 2954ms
   ✓ Auth & System API Integration > GET /api/v1/health returns status UP 2747ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
   Duration  15.23s
```

---

## 12. Security, Performance & Architectural Decisions

1. **Modular Monolith over Microservices**: Selected to eliminate distributed network latency and two-phase commit overhead while preserving clean domain interfaces.
2. **PostgreSQL Relational + JSONB**: Relational tables enforce ACID lifecycle integrity and foreign keys, while JSONB provides flexibility for dynamic business rules and variable schemas.
3. **Database-Level Idempotency**: PostgreSQL unique indexes ensure race-free deduplication across concurrent submissions.
4. **Neon Connection Pooling**: Configured `DATABASE_URL` with connection pooling for high-throughput runtime API queries, and `DATABASE_URL_UNPOOLED` via `directUrl` for advisory lock migrations.
5. **Cryptographic Protection**: `bcrypt` (10 salt rounds) for password storage, HMAC-SHA256 for signed JWT tokens, and SHA-256 for payload hashing.

---

## 13. Step-by-Step Evaluator Walkthrough Guide

The database is pre-seeded with 4 demo accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@flowguard.local` | `Admin@123` |
| **Operator** | `operator@flowguard.local` | `Operator@123` |
| **Reviewer** | `reviewer@flowguard.local` | `Reviewer@123` |
| **Viewer** | `viewer@flowguard.local` | `Viewer@123` |

### Core Demo Scenarios:

#### Scenario 1: Automated Approval
1. Log in as `operator@flowguard.local` (or click the quick-login button).
2. Go to **New Request** &rarr; Click **Preset: Approval (Score 780)** &rarr; Click **Submit Request**.
3. **Result**: Application is evaluated in real time, dependency check passes, and status transitions to **`APPROVED`** / **`COMPLETED`**.

#### Scenario 2: Automated Rejection
1. Go to **New Request** &rarr; Click **Preset: Reject (Score 520)** &rarr; Click **Submit Request**.
2. **Result**: Application transitions to **`REJECTED`** / **`COMPLETED`**.
3. The rule trace displays that Rule 002 failed because credit score 520 does not satisfy `>= 600`.

#### Scenario 3: Manual Review Workflow
1. Go to **New Request** &rarr; Click **Preset: Review (Score 650)** &rarr; Click **Submit Request**.
2. **Result**: Status becomes **`MANUAL_REVIEW`**.
3. Log out and log in as `reviewer@flowguard.local`.
4. Open **Manual Reviews** &rarr; Select the pending application &rarr; Click **Review Decision**.
5. Enter comment: *"Income verified from bank statements"* &rarr; Click **Approve**.
6. **Result**: Status updates to **`APPROVED`** with reviewer audit attribution.

#### Scenario 4: Dependency Failure & Retry
1. Log in as `admin@flowguard.local` &rarr; Go to **Simulator & Settings**.
2. Set mode to **Temporary Failure / Timeout** &rarr; Click **Activate Mode**.
3. Submit a valid request with credit score 780 &rarr; Status enters **`RETRYING`**.
4. Return to **Simulator & Settings** &rarr; Switch mode back to **Normal Success**.
5. Open the failed request details &rarr; Click **Retry Execution**.
6. **Result**: Attempt #2 succeeds, and status updates to **`APPROVED`** with full attempt history.

#### Scenario 5: Idempotency Verification
1. Submit a request with a fixed `Idempotency-Key` header (e.g. `idem-test-key-101`).
2. Submit the exact same payload again with the same key &rarr; Returns HTTP **200 OK** with existing record (no duplicate execution).
3. Submit a *different* payload with the same key &rarr; Server rejects with HTTP **409 Conflict**.

#### Scenario 6: Workflow Version Isolation
1. As Admin, navigate to **Workflows** &rarr; Edit Application Approval workflow rules.
2. Change minimum credit score to 800 &rarr; Click **Publish Version**.
3. Workflow is now at **Version 2**.
4. Existing requests remain pinned to **Version 1** configuration. New requests execute against **Version 2**.

---

## 14. Submission Details & Verification

- **Candidate Name**: Shib Chandan Mistry
- **Institute**: MNNIT Allahabad
- **Submission Target**: `it@scoreme.in`, `manpreet.kaur@scoreme.in`
- **GitHub Repository**: [https://github.com/shibchandan/FlowGuard](https://github.com/shibchandan/FlowGuard)
- **Automated Tests**: 27 / 27 Passed (Vitest)
- **Database**: Cloud PostgreSQL on Neon Serverless (`neondb` on AWS Singapore)
- **Build Status**:
  - Backend: `npm run build` &rarr; Exit Code 0 (TypeScript compile clean)
  - Frontend: `npm run build` &rarr; Exit Code 0 (Vite production bundle clean)

---

*FlowGuard – Designed and developed for the ScoreMe Placement Drive Hackathon.*
