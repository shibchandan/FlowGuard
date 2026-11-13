# **FlowGuard**

## **High-Level Design (HLD)**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** High-Level Design  
**Version:** 1.0  
**Status:** Development Ready  
**Reference Documents:** PRD v2.0, TRD v2.0, SRS v1.0  
**Purpose:** ScoreMe Recruitment Hackathon

---

# **1\. Introduction**

## **1.1 Purpose**

This document describes the high-level architecture and design of FlowGuard.

It defines:

* Overall system architecture.  
* Architectural style.  
* Major system components.  
* Module responsibilities.  
* Component interactions.  
* Data flow.  
* Workflow execution flow.  
* Database interaction.  
* Security architecture.  
* Deployment architecture.  
* Architectural decisions and trade-offs.

## **1.2 System Overview**

FlowGuard is a configurable workflow decision platform that processes business requests through configurable workflows and business rules.

The system allows administrators to define workflows and rules while providing operators with request management, execution monitoring, and decision explanations.

The initial demonstration use case is Application Approval.

## **1.3 Architectural Goals**

1. Modularity.  
2. Configurability.  
3. Reliability.  
4. Explainability.  
5. Maintainability.  
6. Data consistency.  
7. Extensibility.  
8. Ease of deployment.

---

# **2\. Architecture Style**

## **2.1 Selected Architecture**

**Modular Monolithic Architecture**

FlowGuard will be implemented as a single backend application with clearly separated functional modules.

The frontend and backend will be separate applications communicating through REST APIs.

PostgreSQL will serve as the central persistent database.

## **2.2 Architecture Diagram**

```
flowchart TB
    U[Users]

    subgraph Frontend["Frontend - React + TypeScript"]
        UI[Dashboard and UI]
        API_CLIENT[API Client]
    end

    subgraph Backend["Backend - Node.js + Express"]
        API[REST API Layer]
        AUTH[Authentication and Authorization]
        REQ[Request Management]
        WF[Workflow Engine]
        RULE[Rules Engine]
        STATE[State Management]
        IDEM[Idempotency Manager]
        RETRY[Retry Handler]
        REVIEW[Manual Review]
        AUDIT[Audit Logging]
        SIM[External Dependency Simulator]
        DATA[Prisma Data Access Layer]
    end

    DB[(PostgreSQL)]

    U --> UI
    UI --> API_CLIENT
    API_CLIENT --> API
    API --> AUTH
    API --> REQ
    REQ --> IDEM
    IDEM --> WF
    WF --> RULE
    WF --> STATE
    WF --> RETRY
    WF --> REVIEW
    WF --> SIM
    WF --> AUDIT
    REQ --> DATA
    WF --> DATA
    RULE --> DATA
    STATE --> DATA
    RETRY --> DATA
    REVIEW --> DATA
    AUDIT --> DATA
    DATA --> DB
```

## **2.3 Architectural Rationale**

A modular monolith is selected because:

* It reduces deployment complexity.  
* It is suitable for the hackathon development timeline.  
* It keeps business modules independent.  
* It simplifies debugging.  
* It supports database transactions.  
* It allows future migration to distributed services if necessary.

---

# **3\. Technology Architecture**

| Layer | Technology |
| ----- | ----- |
| Presentation | React |
| Language | TypeScript |
| Frontend Build | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| API Communication | Axios |
| Backend Runtime | Node.js |
| Backend Framework | Express.js |
| Validation | Zod |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT |
| Logging | Pino |
| Testing | Vitest, Supertest |
| Containerization | Docker |

---

# **4\. System Layers**

## **4.1 Presentation Layer**

Technology: React \+ TypeScript.

Responsibilities:

* Display dashboard.  
* Display requests.  
* Submit new requests.  
* Manage workflow configurations.  
* Manage business rules.  
* Display execution details.  
* Display audit history.  
* Manage manual reviews.

The presentation layer shall not contain business decision logic.

## **4.2 API Layer**

Technology: Express.js.

Responsibilities:

* Expose REST endpoints.  
* Receive HTTP requests.  
* Apply middleware.  
* Authenticate users.  
* Validate incoming data.  
* Invoke controller methods.  
* Return standardized responses.

## **4.3 Application Layer**

Responsibilities:

* Coordinate application operations.  
* Manage request submission.  
* Coordinate workflow execution.  
* Handle manual review operations.  
* Coordinate retries.  
* Manage transactions.

## **4.4 Business Logic Layer**

Contains the core engines:

* Workflow Engine.  
* Rules Engine.  
* State Management Engine.  
* Idempotency Manager.  
* Retry Handler.  
* Decision Explanation Generator.

These modules must remain independent of Express route handlers.

## **4.5 Data Access Layer**

Technology: Prisma ORM.

Responsibilities:

* Execute database queries.  
* Manage database transactions.  
* Persist workflow configurations.  
* Persist requests and executions.  
* Retrieve audit history.  
* Manage database relationships.

## **4.6 Persistence Layer**

Technology: PostgreSQL.

Stores all persistent application information, including requests, workflows, rules, executions, transitions, audit events, retries, and manual reviews.

---

# **5\. Major System Modules**

## **5.1 Authentication Module**

Purpose: Secure access to the platform.

Responsibilities:

* User login.  
* Password verification.  
* JWT generation.  
* Token verification.  
* Role-based authorization.

Roles:

* ADMIN  
* OPERATOR  
* REVIEWER  
* VIEWER

## **5.2 Request Management Module**

Purpose: Manage incoming business requests.

Responsibilities:

* Receive requests.  
* Validate request payloads.  
* Generate request identifiers.  
* Associate requests with workflows.  
* Retrieve request details.  
* Retrieve request history.

## **5.3 Workflow Configuration Module**

Purpose: Manage configurable workflow definitions.

Responsibilities:

* Create workflow definitions.  
* Define stages.  
* Define conditional transitions.  
* Maintain versions.  
* Publish configurations.  
* Validate workflow structure.

Each execution must be associated with a specific published workflow version.

## **5.4 Rules Engine**

Purpose: Evaluate business conditions dynamically.

Responsibilities:

* Load rules for the selected workflow version.  
* Evaluate configured conditions.  
* Apply priority ordering.  
* Generate evaluation results.  
* Determine resulting actions.  
* Produce decision explanations.

Supported operators:

* EQUALS  
* NOT\_EQUALS  
* GREATER\_THAN  
* GREATER\_THAN\_OR\_EQUAL  
* LESS\_THAN  
* LESS\_THAN\_OR\_EQUAL  
* IN  
* NOT\_IN  
* EXISTS  
* NOT\_EXISTS

The rules engine must not execute arbitrary JavaScript code.

## **5.5 Workflow Execution Engine**

Purpose: Control the lifecycle of workflow executions.

Responsibilities:

* Initialize execution.  
* Resolve workflow version.  
* Execute stages.  
* Invoke rules engine.  
* Coordinate external dependencies.  
* Determine transitions.  
* Update execution status.  
* Handle terminal outcomes.

The workflow engine must not contain application-specific approval thresholds.

## **5.6 State Management Module**

Purpose: Maintain valid workflow states.

Responsibilities:

* Track current execution state.  
* Validate state transitions.  
* Persist state changes.  
* Record transition reasons.  
* Prevent invalid transitions.

## **5.7 Idempotency Module**

Purpose: Prevent duplicate processing.

Responsibilities:

* Read idempotency keys.  
* Generate request fingerprints.  
* Detect duplicate submissions.  
* Detect conflicting key reuse.  
* Persist idempotency records.  
* Handle concurrent submissions safely.

Database uniqueness constraints are required.

## **5.8 Retry and Failure Module**

Purpose: Handle temporary processing failures.

Responsibilities:

* Detect retryable failures.  
* Apply retry policies.  
* Track retry attempts.  
* Record failure information.  
* Resume eligible executions.  
* Mark exhausted executions as failed or route them for manual review according to configuration.

## **5.9 External Dependency Simulator**

Purpose: Simulate an external verification service.

Responsibilities:

* Return successful verification responses.  
* Simulate timeouts.  
* Simulate temporary failures.  
* Allow controlled recovery.  
* Provide deterministic scenarios for testing.

## **5.10 Manual Review Module**

Purpose: Allow human intervention.

Responsibilities:

* Create review cases.  
* Maintain pending review queue.  
* Assign or record reviewers.  
* Accept approve/reject decisions.  
* Record comments.  
* Resume or terminate the workflow according to configuration.

## **5.11 Audit Logging Module**

Purpose: Maintain a complete execution history.

Responsibilities:

* Record important system events.  
* Record rule evaluations.  
* Record decisions.  
* Record state transitions.  
* Record retry operations.  
* Record manual review actions.  
* Provide audit retrieval.

Audit records must be append-only at the application level.

## **5.12 Dashboard Module**

Purpose: Provide operational visibility.

Responsibilities:

* Display request statistics.  
* Display workflow statistics.  
* Display recent activities.  
* Display failed executions.  
* Display manual review cases.  
* Provide filtering and search.

---

# **6\. Request Processing Architecture**

## **6.1 Normal Request Flow**

```
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Express API
    participant VAL as Validation
    participant IDEM as Idempotency
    participant WF as Workflow Engine
    participant RULE as Rules Engine
    participant DB as PostgreSQL

    User->>UI: Submit application
    UI->>API: POST /requests
    API->>VAL: Validate payload
    VAL-->>API: Validation successful
    API->>IDEM: Check idempotency key
    IDEM->>DB: Check existing record
    DB-->>IDEM: No duplicate
    IDEM-->>API: New request
    API->>WF: Start execution
    WF->>DB: Load workflow version
    WF->>RULE: Evaluate rules
    RULE->>DB: Load configured rules
    DB-->>RULE: Rule configuration
    RULE-->>WF: Evaluation results
    WF->>DB: Persist decision and transitions
    WF-->>API: Execution result
    API-->>UI: Response
    UI-->>User: Display result
```

## **6.2 Request Processing Steps**

1. User submits a request.  
2. Frontend sends a REST API request.  
3. Backend validates the payload.  
4. Idempotency manager checks for duplicate submissions.  
5. Request is associated with an active workflow version.  
6. Workflow execution is initialized.  
7. Rules engine evaluates configured rules.  
8. Workflow engine determines the next stage.  
9. State changes and audit events are persisted.  
10. Final outcome is returned to the frontend.

## **6.3 Processing Outcomes**

| Condition | Outcome |
| ----- | ----- |
| All mandatory conditions pass | Continue |
| Business rejection condition matches | REJECTED |
| Review condition matches | MANUAL\_REVIEW |
| Temporary dependency failure | RETRY |
| Retry limit exhausted | FAILED |
| Workflow finishes successfully | COMPLETED or APPROVED |

The exact transition behaviour shall be controlled by workflow configuration.

---

# **7\. Failure and Retry Architecture**

## **7.1 Failure Flow**

```
flowchart TD
    A[Execute Workflow Stage]
    B[Call External Dependency]
    C{Dependency Successful?}
    D[Continue Workflow]
    E{Retry Allowed?}
    F[Record Retry Attempt]
    G[Retry Dependency]
    H[Manual Review or Failed]
    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| E
    E -->|Yes| F
    F --> G
    G --> C
    E -->|No| H
```

## **7.2 Retry Behaviour**

* Retry only eligible failures.  
* Respect configured retry limits.  
* Record every attempt.  
* Avoid creating duplicate workflow executions.  
* Preserve execution identity.  
* Route exhausted failures according to configuration.

## **7.3 External Dependency Isolation**

The external dependency simulator shall be accessed through a dedicated service interface.

This prevents external integration details from becoming tightly coupled to the workflow engine.

---

# **8\. Database Architecture**

## **8.1 Core Entities**

The system shall use the following primary entities:

1. User  
2. Request  
3. WorkflowDefinition  
4. WorkflowVersion  
5. Rule  
6. WorkflowExecution  
7. StateTransition  
8. AuditLog  
9. IdempotencyRecord  
10. RetryRecord  
11. ManualReview

## **8.2 High-Level Entity Relationships**

```
erDiagram
    USER ||--o{ MANUAL_REVIEW : reviews
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_VERSION : contains
    WORKFLOW_VERSION ||--o{ RULE : defines
    REQUEST ||--o{ WORKFLOW_EXECUTION : creates
    WORKFLOW_VERSION ||--o{ WORKFLOW_EXECUTION : uses
    WORKFLOW_EXECUTION ||--o{ STATE_TRANSITION : records
    WORKFLOW_EXECUTION ||--o{ AUDIT_LOG : generates
    WORKFLOW_EXECUTION ||--o{ RETRY_RECORD : has
    WORKFLOW_EXECUTION ||--o{ MANUAL_REVIEW : requires
```

## **8.3 Data Consistency**

The following operations must use appropriate database transactions:

* Creating a request and its initial execution.  
* Updating execution state and recording its transition.  
* Persisting a decision and its audit event.  
* Recording a manual review decision and its workflow transition.

External network calls must not be held inside database transactions.

## **8.4 Workflow Version Consistency**

Each execution must reference the exact workflow version used during initialization.

Publishing a new version must not silently change the configuration of an already-running execution.

---

# **9\. API Architecture**

Base path:

`/api/v1`

## **Authentication**

* POST /auth/login  
* GET /auth/me

## **Requests**

* POST /requests  
* GET /requests  
* GET /requests/  
* GET /requests//history

## **Workflows**

* GET /workflows  
* POST /workflows  
* GET /workflows/  
* PUT /workflows/  
* GET /workflows//versions  
* POST /workflows//versions  
* POST /workflows//publish

## **Rules**

* GET /workflows//rules  
* POST /workflows//rules  
* PUT /rules/

## **Executions**

* GET /executions  
* GET /executions/  
* GET /executions//audit  
* POST /executions//retry

## **Manual Review**

* GET /reviews  
* POST /reviews//approve  
* POST /reviews//reject

## **Dashboard**

* GET /dashboard/stats

All endpoints shall use centralized validation, authentication, authorization, and error handling.

---

# **10\. Security Architecture**

## **10.1 Authentication**

* JWT-based authentication.  
* Password hashing using bcrypt.  
* Protected API routes.

## **10.2 Authorization**

| Operation | Admin | Operator | Reviewer | Viewer |
| ----- | ----- | ----- | ----- | ----- |
| View dashboard | Yes | Yes | Yes | Yes |
| Submit request | Yes | Yes | No | No |
| View requests | Yes | Yes | Yes | Yes |
| Manage workflows | Yes | No | No | No |
| Manage rules | Yes | No | No | No |
| Retry execution | Yes | Yes | No | No |
| Process manual review | Yes | No | Yes | No |
| View audit history | Yes | Yes | Yes | Yes |

Authorization must be enforced by the backend, not only by hiding frontend controls.

## **10.3 Data Protection**

* Validate all incoming payloads.  
* Store secrets in environment variables.  
* Avoid exposing internal errors.  
* Restrict access to administrative operations.  
* Use Prisma for safe database queries.

---

# **11\. Frontend Architecture**

## **11.1 Frontend Structure**

The frontend shall be organized into:

* Pages.  
* Components.  
* Layouts.  
* Hooks.  
* API services.  
* Types.  
* Utilities.

## **11.2 Main Pages**

1. Login.  
2. Dashboard.  
3. Requests.  
4. Request Details.  
5. Workflow Management.  
6. Workflow Configuration.  
7. Rules Management.  
8. Execution Monitor.  
9. Audit Explorer.  
10. Manual Review.

## **11.3 Frontend Communication**

The frontend shall communicate with the backend using Axios.

TanStack Query shall manage server state, caching, and request loading states.

The frontend shall not independently calculate business decisions.

---

# **12\. Deployment Architecture**

## **12.1 Initial Deployment**

The initial development environment shall use Docker Compose.

```
flowchart TB
    B[Web Browser]

    subgraph Docker["Docker Compose Environment"]
        FE[React Frontend]
        BE[Express Backend]
        DB[(PostgreSQL)]
    end

    B --> FE
    FE --> BE
    BE --> DB
```

## **12.2 Deployment Components**

* Frontend container.  
* Backend container.  
* PostgreSQL container.

## **12.3 Environment Configuration**

The system shall use environment variables for:

* Database connection.  
* JWT secret.  
* Backend port.  
* Frontend API base URL.  
* Application environment.  
* External simulator configuration.

An `.env.example` file must be provided.

---

# **13\. Logging and Monitoring**

The backend shall use structured logging.

Important events:

* API request received.  
* Authentication failure.  
* Request validation failure.  
* Workflow started.  
* Rule evaluation completed.  
* State transition completed.  
* External dependency failure.  
* Retry initiated.  
* Manual review decision.  
* Workflow completed or failed.

Logs should include relevant request and execution identifiers for troubleshooting.

Sensitive credentials and passwords must never be logged.

---

# **14\. Architectural Trade-offs**

| Decision | Reason |
| ----- | ----- |
| Modular monolith | Faster implementation and simpler deployment |
| React frontend | Component-based UI development |
| Express backend | Flexible REST API architecture |
| TypeScript | Type safety and maintainability |
| PostgreSQL | Relational consistency and transactions |
| Prisma | Type-safe database access |
| JSONB | Flexible workflow configurations |
| Synchronous initial execution | Lower implementation complexity |
| External dependency simulator | Demonstrates failure and retry behaviour |

---

# **15\. Future Architecture Improvements**

The architecture should allow future extension with:

* Redis for caching or distributed coordination.  
* BullMQ for background processing.  
* Message queues for asynchronous execution.  
* Dedicated workflow execution workers.  
* Notification services.  
* Multi-tenant support.  
* Workflow visualization builder.  
* Advanced monitoring and analytics.

These are not mandatory for the initial hackathon implementation.

---

# **16\. Final Architecture Summary**

FlowGuard will use a React and TypeScript frontend, a Node.js and Express backend, Prisma ORM, and PostgreSQL.

The backend will follow a modular monolithic architecture with independent modules for:

* Request management.  
* Workflow configuration.  
* Workflow execution.  
* Rule evaluation.  
* State management.  
* Idempotency.  
* Retry handling.  
* Manual review.  
* Audit logging.

The system will process requests through versioned, configurable workflows and provide reliable, explainable, and traceable decisions.

**End of Document – HLD v1.0**

