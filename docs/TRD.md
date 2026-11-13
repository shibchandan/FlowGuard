# **FlowGuard**

## **Technical Requirements Document (TRD)**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** Technical Requirements Document  
**Version:** 2.0  
**Status:** Approved Technology Direction  
**Reference:** PRD v1.0  
**Purpose:** ScoreMe Recruitment Hackathon

---

# **1\. Technical Overview**

## **1.1 Purpose**

This document defines the technical architecture, technology stack, development standards, database design, API requirements, security requirements, testing strategy, and deployment approach for FlowGuard.

FlowGuard will be implemented as a modular, configuration-driven workflow decision platform.

## **1.2 Technical Objectives**

* Build a generic workflow execution engine.  
* Implement configurable business rules.  
* Maintain reliable workflow states.  
* Support idempotent request processing.  
* Handle external dependency failures and retries.  
* Maintain complete audit trails.  
* Provide explainable decisions.  
* Develop a responsive administrative dashboard.  
* Ensure modularity, maintainability, and testability.

---

# **2\. Technology Stack**

## **2.1 Frontend**

| Technology | Purpose |
| ----- | ----- |
| React | Frontend framework |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| shadcn/ui | Reusable UI components |
| React Router | Client-side routing |
| TanStack Query | Server state management |
| Axios | HTTP communication |
| Recharts | Dashboard charts |
| Lucide React | Icons |

## **2.2 Backend**

| Technology | Purpose |
| ----- | ----- |
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Backend type safety |
| Prisma ORM | Database access |
| Zod | Runtime validation |
| JWT | Authentication |
| bcrypt | Password hashing |
| Pino | Structured application logging |

## **2.3 Database**

**PostgreSQL** will be the primary database.

PostgreSQL will store:

* Business requests.  
* Workflow definitions.  
* Workflow versions.  
* Rule configurations.  
* Workflow executions.  
* State transition history.  
* Audit logs.  
* Idempotency records.  
* Retry attempts.  
* Manual review records.  
* User and role information.

JSONB columns will be used for flexible workflow definitions, rule conditions, request payloads, and audit event details.

## **2.4 Testing**

| Technology | Purpose |
| ----- | ----- |
| Vitest | Unit testing |
| Supertest | API integration testing |
| Prisma | Test database access |
| Zod | Schema validation testing |

## **2.5 Development and Deployment**

| Technology | Purpose |
| ----- | ----- |
| Git | Version control |
| GitHub | Repository hosting |
| Docker | Containerization |
| Docker Compose | Local environment |
| Postman | API testing |
| Swagger / OpenAPI | API documentation |

---

# **3\. System Architecture**

## **3.1 Architecture Style**

FlowGuard shall follow a **Modular Monolithic Architecture**.

All backend modules will initially run in a single Node.js application while maintaining independent responsibilities and clear boundaries.

### **Reasons for selecting this architecture**

* Faster development within the hackathon timeline.  
* Easier debugging and deployment.  
* Clear separation of business logic.  
* Lower infrastructure complexity.  
* Ability to extract modules into services in the future.

Microservices are not required for the initial implementation.

## **3.2 Core System Components**

1. Frontend Dashboard  
2. Express API Layer  
3. Authentication and Authorization Module  
4. Request Validation Module  
5. Workflow Configuration Manager  
6. Rules Evaluation Engine  
7. Workflow Execution Engine  
8. State Management Module  
9. Retry and Failure Handler  
10. Idempotency Manager  
11. Audit Logging Module  
12. External Dependency Simulator  
13. Prisma Data Access Layer  
14. PostgreSQL Database

## **3.3 Request Processing Architecture**

Incoming Request  
→ Express API  
→ Authentication and Validation  
→ Idempotency Check  
→ Workflow Configuration Resolution  
→ Workflow Initialization  
→ Rules Evaluation  
→ Workflow Execution  
→ State Transition  
→ Audit Logging  
→ Final Decision  
→ API Response

Failures must follow controlled retry, manual review, or terminal failure transitions according to workflow configuration.

---

# **4\. Backend Architecture**

## **4.1 Layered Design**

### **API Layer**

Responsibilities:

* Define Express routes.  
* Accept HTTP requests.  
* Apply authentication middleware.  
* Validate request data.  
* Return standardized responses.

### **Controller Layer**

Responsibilities:

* Handle incoming API requests.  
* Invoke appropriate services.  
* Handle response formatting.  
* Avoid implementing business logic.

### **Service Layer**

Responsibilities:

* Coordinate business operations.  
* Manage request processing.  
* Coordinate transactions.  
* Invoke workflow and rule engines.  
* Manage manual review operations.

### **Engine Layer**

Responsibilities:

* Evaluate configurable rules.  
* Execute workflow stages.  
* Determine state transitions.  
* Handle workflow outcomes.

### **Repository / Data Access Layer**

Responsibilities:

* Interact with PostgreSQL through Prisma.  
* Encapsulate database queries.  
* Maintain consistent data access patterns.

### **Infrastructure Layer**

Responsibilities:

* Database connections.  
* External dependency simulation.  
* Logging.  
* Environment configuration.  
* Error handling.

## **4.2 Engineering Principle**

Business logic must never be tightly coupled to Express route handlers.

Workflow execution and rule evaluation should remain independent of the HTTP framework.

---

# **5\. Workflow Engine Requirements**

## **5.1 Workflow Definition**

Each workflow must contain:

* Workflow ID.  
* Name.  
* Description.  
* Version.  
* Active status.  
* Ordered stages.  
* Transition conditions.  
* Retry policy.  
* Associated rule configuration.

## **5.2 Supported Stages**

The initial engine shall support:

* VALIDATION  
* RULE\_EVALUATION  
* PROCESSING  
* APPROVAL  
* REJECTION  
* MANUAL\_REVIEW  
* RETRY  
* COMPLETED  
* FAILED

## **5.3 Workflow Execution**

The execution engine shall:

1. Resolve the workflow configuration.  
2. Create a workflow execution.  
3. Initialize the workflow state.  
4. Execute the current stage.  
5. Evaluate applicable rules.  
6. Determine the next transition.  
7. Persist state changes.  
8. Generate audit events.  
9. Continue until a terminal or waiting state is reached.

## **5.4 Workflow Versioning**

* Every published workflow configuration must have a version.  
* New executions shall use the active published version.  
* Running executions shall retain their original configuration version.  
* Configuration changes shall not silently alter existing executions.  
* Configuration publishing must validate the workflow before activation.

---

# **6\. Rules Engine Requirements**

## **6.1 Rule Structure**

Each rule shall contain:

* Rule ID.  
* Rule name.  
* Description.  
* Priority.  
* Field or condition.  
* Operator.  
* Expected value.  
* Resulting action.  
* Enabled status.

## **6.2 Supported Operators**

The initial implementation shall support:

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

## **6.3 Rule Evaluation Behaviour**

The engine shall:

* Evaluate rules dynamically from configuration.  
* Support priority-based evaluation.  
* Support multiple rules.  
* Support conditional branching.  
* Produce an individual result for each evaluated rule.  
* Record the final decision and its explanation.  
* Handle invalid configurations safely.

Rule evaluation must not use arbitrary JavaScript execution, `eval()`, or dynamically executed code.

## **6.4 Example Rule Configuration**

```
{
  "ruleId": "MINIMUM_SCORE",
  "name": "Minimum Eligibility",
  "priority": 1,
  "field": "score",
  "operator": "GREATER_THAN_OR_EQUAL",
  "value": 60,
  "action": "CONTINUE",
  "enabled": true
}
```

Thresholds and resulting actions must remain configurable.

---

# **7\. Database Architecture**

## **7.1 Database Technology**

* Database: PostgreSQL  
* ORM: Prisma  
* Migration management: Prisma Migrate  
* Flexible configuration storage: JSONB

## **7.2 Core Database Models**

### **1\. User**

Stores platform users.

Fields:

* id  
* name  
* email  
* passwordHash  
* role  
* createdAt  
* updatedAt

### **2\. Request**

Stores incoming business requests.

Fields:

* id  
* requestId  
* workflowId  
* payload  
* status  
* createdAt  
* updatedAt

### **3\. WorkflowDefinition**

Stores workflow metadata.

Fields:

* id  
* workflowId  
* name  
* description  
* isActive  
* createdAt  
* updatedAt

### **4\. WorkflowVersion**

Stores versioned workflow configurations.

Fields:

* id  
* workflowDefinitionId  
* version  
* configuration  
* publishedAt  
* createdAt

### **5\. Rule**

Stores configurable business rules.

Fields:

* id  
* workflowVersionId  
* ruleId  
* name  
* priority  
* condition  
* action  
* enabled

### **6\. WorkflowExecution**

Stores individual workflow executions.

Fields:

* id  
* requestId  
* workflowVersionId  
* currentStage  
* status  
* startedAt  
* completedAt

### **7\. StateTransition**

Stores workflow state history.

Fields:

* id  
* executionId  
* previousState  
* newState  
* reason  
* createdAt

### **8\. AuditLog**

Stores execution and decision events.

Fields:

* id  
* executionId  
* eventType  
* eventData  
* createdAt

### **9\. IdempotencyRecord**

Stores request deduplication information.

Fields:

* id  
* idempotencyKey  
* requestHash  
* status  
* responseData  
* createdAt  
* updatedAt

### **10\. RetryRecord**

Stores retry attempts.

Fields:

* id  
* executionId  
* attemptNumber  
* errorMessage  
* retryStatus  
* createdAt

### **11\. ManualReview**

Stores requests awaiting human decisions.

Fields:

* id  
* executionId  
* reviewReason  
* reviewStatus  
* reviewerId  
* reviewerDecision  
* reviewedAt

## **7.3 Database Integrity Requirements**

* Use primary and foreign keys.  
* Add unique constraints where necessary.  
* Use appropriate indexes.  
* Enforce unique idempotency keys.  
* Use database transactions for related state changes.  
* Maintain referential integrity.  
* Avoid deleting historical workflow execution and audit records.

The final Prisma schema must define appropriate relationships and constraints.

---

# **8\. Transaction Management**

This is a critical part of FlowGuard.

## **8.1 Transaction Requirements**

Related operations shall be committed atomically wherever consistency requires it.

Example: A successful workflow transition may require:

1. Updating execution status.  
2. Updating request status.  
3. Creating a state transition record.  
4. Creating an audit log.

These operations must be grouped into an appropriate Prisma transaction.

## **8.2 Failure Behaviour**

If a database transaction fails:

* All changes within that transaction must roll back.  
* The application must not return a successful result.  
* Errors must be logged.  
* The execution must remain in a consistent persisted state.

External HTTP calls must not be treated as part of a PostgreSQL transaction. Their outcomes and retry handling must be managed separately.

---

# **9\. API Architecture**

Base URL:

`/api/v1`

## **9.1 Request APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| POST | /requests | Submit request |
| GET | /requests | List requests |
| GET | /requests/ | Request details |
| GET | /requests//history | Request history |

## **9.2 Workflow APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /workflows | List workflows |
| POST | /workflows | Create workflow |
| GET | /workflows/ | Workflow details |
| PUT | /workflows/ | Update workflow metadata |
| GET | /workflows//versions | List versions |
| POST | /workflows//versions | Create workflow version |
| POST | /workflows//publish | Publish configuration |

## **9.3 Rule APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /workflows//rules | List rules |
| POST | /workflows//rules | Create rule |
| PUT | /rules/ | Update rule |
| DELETE | /rules/ | Deactivate rule |

## **9.4 Execution APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /executions | List executions |
| GET | /executions/ | Execution details |
| GET | /executions//audit | Audit history |
| POST | /executions//retry | Retry eligible execution |

## **9.5 Manual Review APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /reviews | Pending review list |
| POST | /reviews//approve | Approve review |
| POST | /reviews//reject | Reject review |

## **9.6 Dashboard APIs**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /dashboard/stats | Statistics |
| GET | /dashboard/recent-activity | Recent activities |

All endpoints must use consistent response structures, validation, error handling, and appropriate HTTP status codes.

---

# **10\. Idempotency Requirements**

## **10.1 Implementation**

The API shall support an `Idempotency-Key` HTTP header for request submission.

## **10.2 Processing Logic**

1. Receive the idempotency key.  
2. Generate a stable hash of the relevant request data.  
3. Check whether the key already exists.  
4. If the same key and same payload exist, return the original result or current processing status.  
5. If the same key is reused with a different payload, return a conflict response.  
6. If the key is new, reserve it safely.  
7. Create the workflow execution.  
8. Persist the result and idempotency record.

## **10.3 Concurrency Requirements**

* Use database uniqueness constraints.  
* Handle simultaneous duplicate submissions.  
* Use transactions for reservation and processing initialization.  
* Never rely only on an in-memory duplicate-checking mechanism.

---

# **11\. Retry and Failure Handling**

## **11.1 External Dependency Simulator**

Create a simulated external verification service.

It should support:

* Successful responses.  
* Temporary timeout.  
* Temporary service failure.  
* Configurable failure probability or deterministic test scenarios.  
* Successful response after a temporary failure.

## **11.2 Retry Policy**

Retry configuration shall support:

* Maximum attempts.  
* Retryable error types.  
* Configurable delay.  
* Retry history.  
* Final failure handling.

The initial implementation may use controlled synchronous retries. Retry logic must be isolated so background job processing can be added later.

## **11.3 Required Failure Scenarios**

* External dependency timeout.  
* External dependency error.  
* Database transaction failure.  
* Duplicate submission.  
* Invalid workflow configuration.  
* Retry exhaustion.  
* Invalid state transition.

---

# **12\. Audit Logging**

Every significant workflow operation must produce an audit event.

Required events include:

* REQUEST\_RECEIVED  
* VALIDATION\_COMPLETED  
* WORKFLOW\_STARTED  
* RULE\_EVALUATED  
* DECISION\_GENERATED  
* STATE\_CHANGED  
* RETRY\_INITIATED  
* DEPENDENCY\_RESPONSE  
* MANUAL\_REVIEW\_CREATED  
* MANUAL\_REVIEW\_COMPLETED  
* WORKFLOW\_COMPLETED  
* WORKFLOW\_FAILED

Audit records must include:

* Event ID.  
* Execution ID.  
* Event type.  
* Timestamp.  
* Relevant event data.  
* Decision or transition reason.

Audit logs must be append-only at the application level. Ordinary users must not have permission to modify historical records.

---

# **13\. Frontend Requirements**

## **13.1 Main Pages**

1. Dashboard  
2. Request Management  
3. Request Details  
4. Workflow Management  
5. Workflow Configuration  
6. Rules Management  
7. Execution Monitor  
8. Audit Explorer  
9. Manual Review

## **13.2 UI Requirements**

* Responsive layout.  
* Reusable components.  
* Consistent typography.  
* Search and filtering.  
* Pagination.  
* Loading states.  
* Error states.  
* Form validation.  
* Status indicators.  
* Decision explanation timeline.  
* Workflow execution visualization.

## **13.3 Design Direction**

Build a modern enterprise SaaS interface.

Prioritize clarity, information hierarchy, usability, and professional presentation over unnecessary visual effects.

---

# **14\. Authentication and Security**

The system shall support:

* JWT-based authentication.  
* Password hashing using bcrypt.  
* Role-based access control.  
* Protected administrative routes.  
* Input validation using Zod.  
* Safe environment variable management.  
* CORS configuration.  
* Rate limiting on sensitive endpoints.  
* Secure error handling.  
* Parameterized database access through Prisma.

Initial roles:

* ADMIN  
* OPERATOR  
* VIEWER

Only authorized administrators may modify workflow configurations.

Manual review decisions must be restricted to authorized users.

---

# **15\. Testing Requirements**

## **15.1 Unit Tests**

Test:

* Rule evaluation.  
* Workflow transitions.  
* Configuration validation.  
* Idempotency logic.  
* Retry policies.  
* State validation.

## **15.2 Integration Tests**

Test:

* Request submission.  
* Database persistence.  
* Workflow execution.  
* Audit record creation.  
* External dependency failure.  
* Manual review.  
* Transaction rollback.

## **15.3 Mandatory Test Scenarios**

1. Successful request processing.  
2. Invalid input.  
3. Business rule rejection.  
4. Conditional branching.  
5. Manual review.  
6. Duplicate request.  
7. Same idempotency key with different payload.  
8. Concurrent duplicate requests.  
9. External dependency failure.  
10. Successful retry.  
11. Retry exhaustion.  
12. Database transaction failure.  
13. Workflow configuration version change.  
14. Audit history verification.

---

# **16\. Performance and Scalability**

The initial implementation shall prioritize correctness and reliability.

Technical requirements:

* Database indexing.  
* Pagination.  
* Efficient Prisma queries.  
* Connection pooling.  
* Structured logging.  
* Separation of execution logic from API handlers.  
* Avoid unnecessary database queries.

Future scaling options:

* Redis for distributed coordination or caching.  
* Background workers.  
* BullMQ for asynchronous job processing.  
* Message queues.  
* Separately deployed workflow execution services.

These are future extension points, not mandatory initial dependencies.

---

# **17\. Deployment Requirements**

The application shall support local deployment using Docker Compose.

Expected services:

* Frontend.  
* Backend.  
* PostgreSQL.

The README shall contain:

* Installation instructions.  
* Environment variable configuration.  
* Database setup.  
* Prisma migration commands.  
* Seed instructions.  
* Backend startup.  
* Frontend startup.  
* Test execution.  
* Demo account details, if applicable.

---

# **18\. Repository Structure**

```
FlowGuard/
│
├── docs/
│   ├── PRD.md
│   └── TRD.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── engines/
│   │   │   ├── workflow/
│   │   │   └── rules/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── integrations/
│   │   ├── utils/
│   │   ├── types/
│   │   └── app.ts
│   │
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
│
├── config/
│   ├── workflows/
│   └── rules/
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# **19\. Development Standards**

The following standards are mandatory:

1. Use TypeScript throughout frontend and backend.  
2. Enable strict TypeScript checking.  
3. Keep controllers thin.  
4. Keep business logic inside services and engines.  
5. Use Prisma for database operations.  
6. Use Zod for runtime validation.  
7. Avoid `any` wherever practical.  
8. Avoid duplicated business logic.  
9. Use centralized error handling.  
10. Use environment variables for secrets.  
11. Never commit credentials.  
12. Use database migrations.  
13. Write automated tests for critical business logic.  
14. Maintain clear naming conventions.  
15. Use meaningful Git commits.  
16. Document significant technical decisions.

---

# **20\. Technical Acceptance Criteria**

The implementation shall be considered technically acceptable when:

* Frontend and backend start successfully.  
* PostgreSQL connects successfully.  
* Prisma migrations run successfully.  
* APIs are documented.  
* Request validation works.  
* Workflow definitions are configurable.  
* Rules are evaluated dynamically.  
* Workflow configurations support versioning.  
* State transitions are persisted.  
* Audit logs are generated.  
* Idempotency works under concurrent submissions.  
* Retry mechanisms work.  
* External dependency failures are simulated.  
* Transaction failures do not create inconsistent records.  
* Manual review works.  
* Required tests pass.  
* Setup instructions are reproducible.

---

# **21\. Architecture Trade-offs**

| Decision | Justification |
| ----- | ----- |
| Node.js \+ Express | Flexible and familiar REST API development |
| TypeScript | Better maintainability and type safety |
| PostgreSQL | Relational consistency and transactions |
| Prisma | Type-safe database access |
| JSONB | Flexible workflow and rule configurations |
| Modular monolith | Reduced deployment complexity |
| Synchronous initial execution | Faster hackathon implementation |
| React | Interactive administrative dashboard |
| Docker Compose | Reproducible local environment |

---

# **22\. Final Technical Definition**

FlowGuard shall be developed using React, TypeScript, Node.js, Express.js, PostgreSQL, and Prisma.

The system shall follow a modular monolithic architecture with independently structured workflow execution, rule evaluation, state management, idempotency, retry handling, and audit logging modules.

All business workflow definitions and rules must be configuration-driven.

The implementation shall prioritize reliability, consistency, explainability, maintainability, and extensibility.

**End of Document – TRD v2.0**

