# FlowGuard – Comprehensive Technical Project Report

**Project Name**: FlowGuard – Configurable Workflow Decision Platform  
**Target Organization**: ScoreMe Solutions Pvt. Ltd.  
**Recruitment Drive**: Placement Drive Hackathon (MNNIT Allahabad)  
**Submission Date**: November 2026  
**Repository**: [FlowGuard Source Repository](./)  
**Author**: Candidate, MNNIT Allahabad  

---

## Executive Summary

**FlowGuard** is an enterprise-grade, configuration-driven workflow decision platform designed to automate complex, multi-stage business decisions. Built as a high-performance modular monolith in TypeScript, FlowGuard replaces brittle hardcoded business logic with versioned, immutable rule configurations, deterministic rule evaluation, transactional state machine transitions, strict idempotency, simulated dependency fault recovery, and human-in-the-loop manual review queues.

Every decision made by FlowGuard produces a fully explainable audit trace detailing which rules were evaluated, the actual vs. expected values, the operators applied, the pass/fail status, and the exact timestamp.

The platform achieves a **100% pass rate** on all 27 automated unit and integration tests, operates with zero runtime dynamic code execution (`eval()` or `Function()` are strictly banned), and uses PostgreSQL (Neon cloud) with Prisma ORM for ACID consistency.

---

## Table of Contents

1. [Problem Statement & Objectives](#1-problem-statement--objectives)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Backend Modular Architecture](#3-backend-modular-architecture)
4. [Database Architecture & Data Models](#4-database-architecture--data-models)
5. [State Machine & Execution Lifecycle](#5-state-machine--execution-lifecycle)
6. [Safe Configurable Rule Engine](#6-safe-configurable-rule-engine)
7. [Idempotency & Concurrency Safety](#7-idempotency--concurrency-safety)
8. [Dependency Simulator & Fault Recovery](#8-dependency-simulator--fault-recovery)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Frontend Architecture & UI System](#10-frontend-architecture--ui-system)
11. [Verification & Automated Test Suite](#11-verification--automated-test-suite)
12. [Security, Performance & Design Decisions](#12-security-performance--design-decisions)
13. [Step-by-Step Evaluation Walkthrough](#13-step-by-step-evaluation-walkthrough)
14. [Conclusion & Future Roadmap](#14-conclusion--future-roadmap)

---

## 1. Problem Statement & Objectives

Financial, insurance, and enterprise verification platforms frequently handle workflows such as loan origination, merchant onboarding, underwriting, and claim processing. Traditional architectures suffer from:
1. **Hardcoded Rules**: Business logic buried inside code requiring code deployment and regression testing for simple policy changes.
2. **Lack of Explainability**: Inability to provide applicants and auditors with exact mathematical justification for why an application was rejected or sent for review.
3. **Double-Processing & Race Conditions**: Inability to handle rapid duplicate submissions from flaky network clients safely.
4. **Fragile External Integrations**: Outages in third-party credit bureaus, identity providers, or fraud checks resulting in stuck or dropped requests without retry tracking.
5. **Lack of Version Auditing**: Inability to reproduce a decision made months earlier under an earlier policy version.

### Core Objectives Delivered:
- **Zero Hardcoded Rules**: Workflows, schemas, thresholds, and priorities defined in versioned JSON configurations.
- **Strict Version Immutability**: Published workflow versions cannot be modified; in-flight executions remain permanently pinned to their origin version.
- **ACID Transactional State Machine**: State transitions recorded with strict linear progression and append-only audit logs.
- **Database-Level Idempotency**: Cryptographic SHA-256 payload hashing backed by PostgreSQL unique composite indexes.
- **Configurable Fault Injection**: Internal external dependency simulator with `SUCCESS`, `TEMPORARY_FAILURE`, and `PERMANENT_FAILURE` modes.
- **Human-in-the-Loop Reviews**: Automatic routing of borderline requests to an authorized reviewer queue with decision attribution.

---

## 2. High-Level System Architecture

FlowGuard employs a **Modular Monolith** architecture. This avoids the distributed transaction and deployment overhead of microservices while maintaining clean separation of concerns and domain boundaries.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│                      React 18 + TypeScript + Vite + Tailwind CSS                       │
│     [Dashboard]      [Workflows]      [Requests]      [Reviews]      [Audit Logs]      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST APIs (/api/v1) + JWT
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                   API GATEWAY & MIDDLEWARE                             │
│       Rate Limiter  │  Helmet  │  CORS  │  JWT Auth Guard  │  RBAC Role Guard  │  Zod  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                  CORE DOMAIN SERVICES                                  │
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

## 3. Backend Modular Architecture

The backend (`d:\FlowGuard\backend\src\`) is structured by business domain:

```
src/
├── config/                  # Validated environment configuration (env.ts, database.ts, logger.ts)
├── middleware/              # Reusable Express middleware
│   ├── auth.middleware.ts   # JWT extraction, signature verification, user resolution
│   ├── role.middleware.ts   # Role-Based Access Control guards (ADMIN, OPERATOR, REVIEWER, VIEWER)
│   ├── validate.middleware.ts# Generic Zod runtime schema request validator
│   └── error.middleware.ts  # Centralized error handler with standardized JSON error responses
├── modules/                 # Domain modules
│   ├── auth/                # Login, JWT issuing, bcrypt hashing, profile retrieval
│   ├── workflows/           # Definition management, draft iteration, version publishing
│   ├── rules/               # Pure-function rule evaluator and engine (10 operators)
│   ├── requests/            # Submission intake, schema validation, listing, history
│   ├── executions/          # Execution lifecycle orchestration, trace recording, retries
│   ├── idempotency/         # SHA-256 payload hashing, duplicate checking, conflict handling
│   ├── retry/               # Retry eligibility, attempt counters, retry history
│   ├── reviews/             # Review queue management, approve/reject decision submission
│   ├── audit/               # Immutable append-only audit event ledger
│   ├── dashboard/           # Real-time metrics aggregation and recent activity stream
│   └── simulator/           # Third-party dependency behavior simulator
├── shared/                  # Cross-cutting utilities, types, enums, AppError class
├── tests/                   # Vitest unit & integration test suites
├── app.ts                   # Express application assembly and middleware binding
└── server.ts                # Server bootstrapper, graceful shutdown handlers
```

---

## 4. Database Architecture & Data Models

FlowGuard uses PostgreSQL for relational data integrity and native **JSONB** for dynamic, schemaless rule configurations and request payloads.

### Entity Relationship Model

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

### Key Database Design Highlights:
1. **Idempotency Record Table**: Enforces `UNIQUE(workflowId, idempotencyKey)` at the database constraint level.
2. **Workflow Version Immutability**: Once `status = 'PUBLISHED'`, version records cannot be mutated. Every execution stores `workflowVersionId` directly.
3. **Execution History**: `StateTransition` records every status modification with timestamp and triggering actor.

---

## 5. State Machine & Execution Lifecycle

FlowGuard implements a strictly validated state machine. Invalid transitions (e.g. attempting to retry a completed execution or re-review an already decided request) throw `400 BAD_REQUEST` errors.

### State Transition Diagram

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

### Supported Status Transitions:
- `SUBMITTED` &rarr; `VALIDATING`
- `VALIDATING` &rarr; `EVALUATING`, `FAILED`
- `EVALUATING` &rarr; `PENDING_DEPENDENCY`, `APPROVED`, `REJECTED`, `MANUAL_REVIEW`, `FAILED`
- `PENDING_DEPENDENCY` &rarr; `APPROVED`, `RETRYING`, `FAILED`
- `MANUAL_REVIEW` &rarr; `APPROVED`, `REJECTED`
- `RETRYING` &rarr; `EVALUATING`, `FAILED`
- `APPROVED` &rarr; `COMPLETED`
- `REJECTED` &rarr; `COMPLETED`

---

## 6. Safe Configurable Rule Engine

### Security Guarantee
Dynamic rule engines commonly suffer from remote code execution vulnerabilities by utilizing `eval()` or `new Function()`. FlowGuard's rule engine is **100% deterministic and pure-functional**, executing only strict comparison algorithms.

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

### Evaluation Flow & Explainability:
1. Rules are sorted by `priority` ascending.
2. Inactive rules (`isActive: false`) are skipped.
3. Every evaluated rule produces a `RuleEvaluationResult`:
   - `ruleId`: Unique rule identifier (e.g. `RULE_002`)
   - `ruleName`: Human-readable name
   - `field`: Field evaluated
   - `operator`: Comparison operator
   - `expectedValue`: Configured threshold
   - `actualValue`: Value extracted from request payload
   - `passed`: Boolean evaluation outcome
   - `message`: Specific explanation (e.g., *"Value 520 is not greater than or equal to 600"*)
4. If a rule fails:
   - If `failureAction === 'REJECT'`, evaluation halts and returns immediate decision `REJECTED`.
   - If `failureAction === 'MANUAL_REVIEW'`, evaluation continues to find all issues, then routes the decision to `MANUAL_REVIEW`.

---

## 7. Idempotency & Concurrency Safety

To prevent duplicate financial applications from network retries or concurrent clicks, FlowGuard implements end-to-end idempotency:

1. **Client Header**: Clients submit requests with the `Idempotency-Key` header.
2. **Payload Hash**: The system computes a deterministic `SHA-256` hash of the sorted JSON body.
3. **Database Uniqueness**: An `IdempotencyRecord` table enforces atomic uniqueness per `(workflowId, idempotencyKey)`.
4. **Behavior**:
   - **Identical Key + Identical Payload**: Returns the existing execution and request details with HTTP **200 OK** without re-executing business rules.
   - **Identical Key + Different Payload**: Rejects the submission with HTTP **409 Conflict** (`IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH`).
   - **New Key**: Creates the idempotency lock and proceeds with execution.

---

## 8. Dependency Simulator & Fault Recovery

Many enterprise workflows depend on external systems (e.g., Credit Bureaus, National ID APIs). To facilitate complete resilience testing without third-party dependencies, FlowGuard incorporates an internal configurable dependency simulator:

### Simulation Modes:
- **`SUCCESS`**: External verification succeeds immediately with mock verification reference.
- **`TEMPORARY_FAILURE` / `TIMEOUT`**: Simulates a transient service timeout. The execution transitions to `RETRYING`.
- **`PERMANENT_FAILURE`**: Simulates a fatal downstream rejection. The execution transitions to `FAILED`.

### Safe Execution & Retry Mechanism:
- External calls are invoked **outside database transactions** to prevent long-running locks.
- When an execution enters `RETRYING`, operators or admins can trigger `POST /api/v1/executions/:id/retry`.
- The engine checks:
  1. Execution status must be `RETRYING` or `FAILED`.
  2. Current attempt count must be less than `maxRetries` (default: 3).
- Every retry records a `RetryRecord` with attempt number, reason, timestamp, and audit trail.

---

## 9. Role-Based Access Control (RBAC)

FlowGuard enforces role-based access control strictly on the server:

| Capability / API Group | ADMIN | OPERATOR | REVIEWER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Metrics** | ✅ | ✅ | ✅ | ✅ |
| **List Workflows & Requests** | ✅ | ✅ | ✅ | ✅ |
| **Submit New Business Requests** | ✅ | ✅ | ❌ | ❌ |
| **Inspect Request Execution & Trace** | ✅ | ✅ | ✅ | ✅ |
| **Trigger Failed Execution Retries** | ✅ | ✅ | ❌ | ❌ |
| **Access Manual Reviews Queue** | ✅ | ❌ | ✅ | ❌ |
| **Approve / Reject Manual Reviews** | ✅ | ❌ | ✅ | ❌ |
| **Create Workflows & Versions** | ✅ | ❌ | ❌ | ❌ |
| **Publish Workflow Versions** | ✅ | ❌ | ❌ | ❌ |
| **Configure External Simulator** | ✅ | ❌ | ❌ | ❌ |
| **Inspect Audit Log Ledger** | ✅ | ✅ | ✅ | ✅ |

---

## 10. Frontend Architecture & UI System

The administrative dashboard is built with **React 18 + TypeScript + Vite + Tailwind CSS**:

### Key Pages & Capabilities:
1. **Authentication** ([`Login.tsx`](./frontend/src/pages/Login.tsx)):
   - Standard email/password form with bcrypt verification.
   - Quick-login demo buttons for all 4 roles (`Admin`, `Operator`, `Reviewer`, `Viewer`).
2. **Dashboard** ([`Dashboard.tsx`](./frontend/src/pages/Dashboard.tsx)):
   - Metrics cards: Total Requests, Approved, Rejected, Pending Reviews, Retrying, Failed.
   - Interactive Recharts visualization for request status breakdown.
   - Real-time audit activity feed.
3. **Workflow Management** ([`Workflows.tsx`](./frontend/src/pages/Workflows.tsx), [`WorkflowEditor.tsx`](./frontend/src/pages/WorkflowEditor.tsx), [`WorkflowDetail.tsx`](./frontend/src/pages/WorkflowDetail.tsx)):
   - Visual rule builder: add/remove rules, select operators, set thresholds, assign failure actions (`REJECT` vs `MANUAL_REVIEW`).
   - Version history viewer and one-click immutable publishing.
4. **Request Submission** ([`NewRequest.tsx`](./frontend/src/pages/NewRequest.tsx)):
   - Dynamic form validation.
   - One-click presets:
     - **Preset: Approval (Score 780)**
     - **Preset: Reject (Score 520)**
     - **Preset: Review (Score 650)**
5. **Execution Details & Decision Explainer** ([`RequestDetails.tsx`](./frontend/src/pages/RequestDetails.tsx)):
   - Visual execution lifecycle timeline (`SUBMITTED` &rarr; `VALIDATING` &rarr; `EVALUATING` &rarr; `APPROVED`).
   - Granular rule evaluation card displaying every condition, pass/fail badge, expected threshold, actual value, and reason.
   - One-click retry action button for failed executions.
6. **Manual Reviews Queue** ([`Reviews.tsx`](./frontend/src/pages/Reviews.tsx), [`ReviewDetail.tsx`](./frontend/src/pages/ReviewDetail.tsx)):
   - Reviewer inbox with applicant details, rule trace breakdown, and decision modal for reviewer notes and Approve/Reject action.
7. **Audit Logs** ([`AuditLogs.tsx`](./frontend/src/pages/AuditLogs.tsx)):
   - Filterable, append-only chronological log of all actions.
8. **Simulator Controls** ([`Settings.tsx`](./frontend/src/pages/Settings.tsx)):
   - Real-time toggle between `SUCCESS`, `TEMPORARY_FAILURE`, and `PERMANENT_FAILURE`.

---

## 11. Verification & Automated Test Suite

All tests execute via Vitest and pass with zero failures:

```text
 ✓ src/tests/unit/stateMachine.test.ts (3 tests) 9ms
 ✓ src/tests/unit/ruleEvaluator.test.ts (17 tests) 21ms
 ✓ src/tests/unit/idempotency.test.ts (3 tests) 9ms
 ✓ src/tests/integration/auth.test.ts (4 tests) 2954ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
```

### Detailed Test Matrix:

| Test File | Target | Scenarios Covered | Status |
|---|---|---|:---:|
| `ruleEvaluator.test.ts` | Rule Evaluator | `EQUALS`, `NOT_EQUALS`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`, `EXISTS`, `NOT_EXISTS`, priority ordering, inactive rule skipping, hard reject precedence, manual review routing | **PASS** |
| `stateMachine.test.ts` | State Machine | Valid sequential transitions, invalid transition rejection, terminal state protection | **PASS** |
| `idempotency.test.ts` | Idempotency | Deterministic SHA-256 payload hashing, key reuse validation, conflict detection | **PASS** |
| `auth.test.ts` | API & Auth | Public health probe, invalid credential rejection, valid JWT generation, protected endpoint authorization | **PASS** |

---

## 12. Security, Performance & Design Decisions

### 1. Zero `eval()` Policy
Rule evaluation uses strictly defined pure functions mapping operator strings to strict equality/numeric operators. Malicious rule JSON cannot execute arbitrary code.

### 2. Transactional Integrity with Pooled vs. Direct Connections
Neon serverless PostgreSQL utilizes a connection pooler (`PgBouncer`). While application queries use pooled connections (`DATABASE_URL`), Prisma schema migrations and advisory locks utilize direct unpooled connections (`DATABASE_URL_UNPOOLED`), configured via `directUrl` in `schema.prisma`.

### 3. Separation of External Calls from Database Transactions
Simulated and real external dependency network calls run before or after database transactions. This prevents connection pool starvation and long-held database locks.

### 4. Cryptographic Security
- Passwords hashed with `bcrypt` (10 salt rounds).
- JWT signed with HMAC-SHA256 and configurable expiry (`7d`).
- Rate limiting enabled via `express-rate-limit`.
- Security HTTP headers enabled via `helmet`.

---

## 13. Step-by-Step Evaluation Walkthrough

To verify the platform's 6 core capabilities:

### Scenario 1: Automated Rule Approval
1. Log in as `operator@flowguard.local`.
2. Go to **New Request** &rarr; Click **Preset: Approval (Score 780)** &rarr; Submit.
3. **Outcome**: Request status is `APPROVED` / `COMPLETED`.
4. Rule trace confirms all rules passed (`age >= 18`, `creditScore >= 750`, `income >= 25000`).

### Scenario 2: Automated Rejection
1. Go to **New Request** &rarr; Click **Preset: Reject (Score 520)** &rarr; Submit.
2. **Outcome**: Request status is `REJECTED` / `COMPLETED`.
3. Rule trace highlights `RULE_002` failed with reason: credit score 520 does not satisfy `>= 600`.

### Scenario 3: Manual Review Workflow
1. Go to **New Request** &rarr; Click **Preset: Review (Score 650)** &rarr; Submit.
2. **Outcome**: Request status transitions to `MANUAL_REVIEW`.
3. Log out & log in as `reviewer@flowguard.local`.
4. Open **Manual Reviews** queue &rarr; Select pending case.
5. Add comment: *"Verified salary certificates and bank statements"* &rarr; Click **Approve**.
6. **Outcome**: Status updates to `APPROVED` with reviewer audit attribution.

### Scenario 4: Dependency Failure & Retry Recovery
1. Log in as `admin@flowguard.local` &rarr; Open **Simulator & Settings**.
2. Select **Temporary Failure / Timeout** &rarr; Click **Activate Mode**.
3. Submit a request with credit score 780 &rarr; Status becomes `RETRYING`.
4. Switch simulator back to **Normal Success**.
5. Open request details &rarr; Click **Retry Execution**.
6. **Outcome**: Attempt #2 succeeds, status updates to `APPROVED` / `COMPLETED`, and retry history records attempt count.

### Scenario 5: Idempotency & Duplicate Prevention
1. Submit request with header `Idempotency-Key: scoreme-test-idem-001`.
2. Submit exact same payload again with the same key &rarr; Server returns **200 OK** with existing record (no re-execution).
3. Submit a *different* payload with the same key &rarr; Server rejects with **409 Conflict**.

### Scenario 6: Immutable Workflow Version Isolation
1. As Admin, edit the Application Approval workflow and increase credit score to 800.
2. Publish as **Version 2**.
3. Previously executed requests remain permanently linked to **Version 1**. New submissions execute against **Version 2**.

---

## 14. Conclusion & Future Roadmap

FlowGuard delivers a complete, production-ready implementation of a configurable workflow decision platform. By leveraging PostgreSQL, TypeScript, and a pure-functional rule engine, it provides the safety, explainability, and fault tolerance demanded by enterprise financial systems.

### Future Enhancements:
- **Asynchronous Task Workers**: Integrating BullMQ / Redis for distributed asynchronous execution queues.
- **Complex Conditional Grouping**: Extending the rule engine to support nested `AND` / `OR` tree logic.
- **Webhook Dispatchers**: Automated outbound HTTP notifications upon terminal state completion.

---

*Report submitted for ScoreMe Placement Drive Hackathon.*
