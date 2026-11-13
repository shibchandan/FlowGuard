# **FlowGuard – Low-Level Design (LLD)**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** Low-Level Design (LLD)  
**Version:** 1.0  
**Status:** Implementation Ready  
**Backend:** Node.js, Express.js, TypeScript  
**Database:** PostgreSQL with Prisma ORM  
**Frontend:** React, TypeScript, Vite, Tailwind CSS

---

# **1\. Introduction**

## **1.1 Purpose**

This document describes the internal implementation of FlowGuard, including:

* Backend module responsibilities  
* Service and repository structure  
* Workflow execution logic  
* Configurable rule evaluation  
* Request lifecycle and state transitions  
* Idempotency handling  
* Retry and failure management  
* Audit logging  
* API implementation details  
* Validation and error handling  
* Testing strategy

The objective is to provide sufficiently detailed instructions for implementing FlowGuard without introducing unnecessary architectural complexity.

## **1.2 Design Principles**

1. Modular monolithic architecture.  
2. Separation of business logic from HTTP controllers.  
3. Configuration-driven workflow execution.  
4. No arbitrary JavaScript execution in business rules.  
5. Transaction-safe state changes and audit records.  
6. Idempotent request processing.  
7. Explainable decisions.  
8. Consistent error handling.  
9. Type-safe implementation.  
10. Simple implementation suitable for the hackathon timeline.

---

# **2\. Technology and Implementation Standards**

| Layer | Technology |
| ----- | ----- |
| Runtime | Node.js |
| Backend framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Authentication | JWT |
| Password hashing | bcrypt |
| Logging | Pino |
| Frontend | React \+ TypeScript |
| API communication | Axios |
| Data fetching | TanStack Query |
| Unit testing | Vitest |
| API testing | Supertest |
| Deployment | Docker Compose |

## **2.1 Coding Standards**

* Use TypeScript strict mode.  
* Use async/await for asynchronous operations.  
* Keep controllers thin.  
* Put business logic in services.  
* Access the database through repositories where practical.  
* Validate external input using Zod.  
* Use centralized error middleware.  
* Never expose passwords, password hashes, or JWT secrets.  
* Avoid duplicated business logic.  
* Use enums for fixed status values.

---

# **3\. Backend Project Structure**

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── logger.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   │
│   │   ├── requests/
│   │   │   ├── request.controller.ts
│   │   │   ├── request.service.ts
│   │   │   ├── request.repository.ts
│   │   │   ├── request.routes.ts
│   │   │   └── request.schema.ts
│   │   │
│   │   ├── workflows/
│   │   │   ├── workflow.controller.ts
│   │   │   ├── workflow.service.ts
│   │   │   ├── workflow.repository.ts
│   │   │   └── workflow.schema.ts
│   │   │
│   │   ├── rules/
│   │   │   ├── rule.engine.ts
│   │   │   ├── rule.evaluator.ts
│   │   │   ├── rule.schema.ts
│   │   │   └── rule.types.ts
│   │   │
│   │   ├── executions/
│   │   │   ├── execution.controller.ts
│   │   │   ├── execution.service.ts
│   │   │   ├── execution.repository.ts
│   │   │   └── execution.routes.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── audit.service.ts
│   │   │   └── audit.repository.ts
│   │   │
│   │   ├── idempotency/
│   │   │   └── idempotency.service.ts
│   │   │
│   │   ├── retry/
│   │   │   └── retry.service.ts
│   │   │
│   │   ├── reviews/
│   │   │   ├── review.controller.ts
│   │   │   ├── review.service.ts
│   │   │   └── review.routes.ts
│   │   │
│   │   ├── integrations/
│   │   │   └── dependency.simulator.ts
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── enums/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── app.ts
│   └── server.ts
│
└── tests/
    ├── unit/
    └── integration/
```

---

# **4\. Core Data Types and Enums**

## **4.1 User Roles**

```
export enum UserRole {
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
  REVIEWER = "REVIEWER",
  VIEWER = "VIEWER"
}
```

## **4.2 Request Status**

```
export enum RequestStatus {
  RECEIVED = "RECEIVED",
  VALIDATED = "VALIDATED",
  PROCESSING = "PROCESSING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  RETRYING = "RETRYING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

## **4.3 Execution Status**

```
export enum ExecutionStatus {
  RUNNING = "RUNNING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  RETRY = "RETRY",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

## **4.4 Rule Operators**

```
export enum RuleOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GT = "GT",
  GTE = "GTE",
  LT = "LT",
  LTE = "LTE",
  IN = "IN",
  NOT_IN = "NOT_IN",
  EXISTS = "EXISTS",
  NOT_EXISTS = "NOT_EXISTS"
}
```

## **4.5 Execution Stages**

```
export enum ExecutionStage {
  VALIDATION = "VALIDATION",
  RULE_EVALUATION = "RULE_EVALUATION",
  PROCESSING = "PROCESSING",
  APPROVAL = "APPROVAL",
  REJECTION = "REJECTION",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  RETRY = "RETRY",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

---

# **5\. Database Design Details**

The database schema should follow the TRD and HLD.

## **5.1 Main Entities**

### **User**

Stores authenticated platform users.

Important fields:

* id  
* name  
* email  
* passwordHash  
* role  
* createdAt  
* updatedAt

### **Request**

Stores submitted business requests.

Important fields:

* id  
* referenceNumber  
* workflowId  
* submittedBy  
* status  
* inputData (JSONB)  
* createdAt  
* updatedAt

### **WorkflowDefinition**

Stores workflow metadata.

Important fields:

* id  
* name  
* description  
* isActive  
* createdAt  
* updatedAt

### **WorkflowVersion**

Stores immutable published workflow configurations.

Important fields:

* id  
* workflowId  
* version  
* configuration (JSONB)  
* publishedAt  
* publishedBy

### **WorkflowExecution**

Stores execution information.

Important fields:

* id  
* requestId  
* workflowVersionId  
* status  
* currentStage  
* decision  
* startedAt  
* completedAt

### **StateTransition**

Stores status changes.

Important fields:

* id  
* requestId  
* executionId  
* fromStatus  
* toStatus  
* reason  
* createdAt

### **AuditLog**

Stores important system activities.

Important fields:

* id  
* entityType  
* entityId  
* action  
* actorId  
* metadata (JSONB)  
* createdAt

### **IdempotencyRecord**

Stores duplicate prevention information.

Important fields:

* id  
* idempotencyKey  
* requestHash  
* requestId  
* createdAt

The idempotency key must have a unique database constraint within its intended scope.

### **RetryRecord**

Stores retry attempts.

Important fields:

* id  
* executionId  
* attemptNumber  
* reason  
* status  
* createdAt

### **ManualReview**

Stores requests awaiting human decisions.

Important fields:

* id  
* requestId  
* assignedTo  
* reviewStatus  
* reviewerComment  
* reviewedAt

## **5.2 Database Constraints**

* User email must be unique.  
* Workflow version number must be unique within a workflow.  
* Idempotency key must be unique within its defined scope.  
* Retry attempt number must be unique within an execution.  
* Each execution must reference a valid request and workflow version.  
* Required relationships must use foreign keys.  
* Published workflow versions must not be edited in place.

---

# **6\. Workflow Configuration Model**

A workflow must be configurable without changing backend source code.

## **6.1 Example Configuration**

```
{
  "workflowName": "Loan Application Approval",
  "version": 1,
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
      "failureAction": "REJECT",
      "priority": 1
    },
    {
      "id": "RULE_002",
      "name": "Credit Score Approval",
      "field": "creditScore",
      "operator": "GTE",
      "value": 750,
      "failureAction": "MANUAL_REVIEW",
      "priority": 2
    },
    {
      "id": "RULE_003",
      "name": "Minimum Income",
      "field": "monthlyIncome",
      "operator": "GTE",
      "value": 25000,
      "failureAction": "MANUAL_REVIEW",
      "priority": 3
    }
  ],
  "execution": {
    "onSuccess": "APPROVE",
    "onFailure": "REJECT",
    "maxRetries": 3
  }
}
```

**Important:** The example is illustrative. Actual rule configuration must support explicit conditions and actions. In particular, a credit score below 750 should not automatically be treated as a rejection if the intended business policy is to send it for manual review.

## **6.2 Rule Configuration Type**

```
export interface RuleConfig {
  id: string;
  name: string;
  field: string;
  operator: RuleOperator;
  value?: unknown;
  priority: number;
  failureAction: "REJECT" | "MANUAL_REVIEW";
  isActive: boolean;
}
```

Rules are evaluated in ascending priority order.

---

# **7\. Rule Engine Implementation**

## **7.1 Responsibilities**

The rule engine must:

1. Receive validated request data.  
2. Load the pinned workflow version.  
3. Retrieve active rules.  
4. Sort rules by priority.  
5. Evaluate conditions.  
6. Record every evaluation result.  
7. Determine the final decision.  
8. Return an explainable result.

## **7.2 Rule Evaluator**

The evaluator should be a pure function without database operations.

```
interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  actualValue: unknown;
  expectedValue: unknown;
  operator: RuleOperator;
  message: string;
}
```

Example implementation:

```
export function evaluateRule(
  actual: unknown,
  operator: RuleOperator,
  expected?: unknown
): boolean {
  switch (operator) {
    case RuleOperator.EQUALS:
      return actual === expected;

    case RuleOperator.NOT_EQUALS:
      return actual !== expected;

    case RuleOperator.GT:
      return typeof actual === "number" &&
        typeof expected === "number" &&
        actual > expected;

    case RuleOperator.GTE:
      return typeof actual === "number" &&
        typeof expected === "number" &&
        actual >= expected;

    case RuleOperator.LT:
      return typeof actual === "number" &&
        typeof expected === "number" &&
        actual < expected;

    case RuleOperator.LTE:
      return typeof actual === "number" &&
        typeof expected === "number" &&
        actual <= expected;

    case RuleOperator.IN:
      return Array.isArray(expected) &&
        expected.includes(actual);

    case RuleOperator.NOT_IN:
      return Array.isArray(expected) &&
        !expected.includes(actual);

    case RuleOperator.EXISTS:
      return actual !== undefined && actual !== null;

    case RuleOperator.NOT_EXISTS:
      return actual === undefined || actual === null;

    default:
      throw new Error("Unsupported rule operator");
  }
}
```

Production implementation must additionally validate operand types and handle missing fields explicitly.

## **7.3 Rule Engine Flow**

```
START
  |
Load workflow version
  |
Load active rules
  |
Sort by priority
  |
Evaluate first rule
  |
  +---- PASS ----> Evaluate next rule
  |
  +---- FAIL ----> Read failure action
                     |
                     +---- REJECT
                     |
                     +---- MANUAL_REVIEW
  |
All rules passed?
  |
  +---- YES ----> Continue workflow
  |
  +---- NO -----> Apply configured failure action
```

## **7.4 Decision Explanation**

The engine must produce structured explanations.

Example:

```
{
  "decision": "MANUAL_REVIEW",
  "summary": "Application requires additional verification.",
  "ruleTrace": [
    {
      "ruleId": "RULE_001",
      "ruleName": "Minimum Age",
      "passed": true,
      "message": "Applicant meets the minimum age requirement."
    },
    {
      "ruleId": "RULE_002",
      "ruleName": "Credit Score Approval",
      "passed": false,
      "message": "Credit score is below the automatic approval threshold."
    }
  ]
}
```

The UI should display this explanation as a readable decision timeline.

---

# **8\. Request Processing Service**

## **8.1 Request Submission**

The request service is responsible for:

1. Validating incoming data.  
2. Checking idempotency.  
3. Finding an active workflow.  
4. Creating the request.  
5. Creating an execution record.  
6. Recording audit events.  
7. Starting workflow processing.

## **8.2 Submission Logic**

```
async function submitRequest(input: SubmitRequestInput) {
  // 1. Validate input with Zod.
  // 2. Calculate a stable payload hash.
  // 3. Check the idempotency key.
  // 4. Resolve active workflow version.
  // 5. Create request and execution.
  // 6. Record audit and initial transition.
  // 7. Start execution.
  // 8. Return request and execution identifiers.
}
```

The request and initial execution should be created atomically.

## **8.3 Input Validation**

Use Zod to validate request payloads.

Example:

```
import { z } from "zod";

export const loanApplicationSchema = z.object({
  applicantName: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(18),
  creditScore: z.number().min(300).max(900),
  monthlyIncome: z.number().positive(),
  requestedAmount: z.number().positive()
});
```

The actual schema should be resolved from the selected workflow configuration, with Zod used to validate its supported schema representation.

---

# **9\. Workflow Execution Service**

## **9.1 Responsibilities**

* Start an execution.  
* Load the pinned workflow version.  
* Run validation.  
* Evaluate business rules.  
* Call simulated external dependencies.  
* Determine final outcomes.  
* Update lifecycle status.  
* Save execution results.  
* Record audit history.

## **9.2 Execution Flow**

```
Request Submitted
       |
       v
Input Validation
       |
       +---- Invalid ----> FAILED
       |
       v
Rule Evaluation
       |
       +---- Reject -----> REJECTED
       |
       +---- Review -----> MANUAL_REVIEW
       |
       v
External Dependency
       |
       +---- Failure ----> RETRY
       |                     |
       |                     v
       |                Retry Service
       |                     |
       |               Max attempts?
       |                /       \
       |              No         Yes
       |              |           |
       |           Retry       FAILED
       |              |
       +--------------+
       |
       v
Approval
       |
       v
COMPLETED
```

## **9.3 Execution Service Interface**

```
interface ExecutionService {
  startExecution(requestId: string): Promise<void>;

  execute(executionId: string): Promise<void>;

  getExecution(executionId: string): Promise<ExecutionResult>;

  retryExecution(executionId: string): Promise<void>;
}
```

## **9.4 Execution Algorithm**

```
async function executeWorkflow(executionId: string) {
  // 1. Load execution, request and pinned workflow version.
  // 2. Verify that execution can be processed.
  // 3. Mark execution as running.
  // 4. Validate request data.
  // 5. Evaluate configured rules.
  // 6. Persist rule trace and decision.
  // 7. If rejected, finalize as REJECTED.
  // 8. If manual review is required, create review record.
  // 9. Otherwise call external dependency simulator.
  // 10. If dependency fails, schedule or record retry.
  // 11. If successful, finalize as APPROVED/COMPLETED.
  // 12. Persist transitions and audit events.
}
```

**Implementation requirement:** Do not keep a database transaction open while calling an external dependency. Persist the execution stage first, perform the dependency call outside the transaction, then persist the result in a new transaction.

---

# **10\. State Management**

## **10.1 Request State Transitions**

Allowed transitions should be explicitly controlled.

| Current Status | Allowed Next Status |
| ----- | ----- |
| RECEIVED | VALIDATED, FAILED |
| VALIDATED | PROCESSING, FAILED |
| PROCESSING | APPROVED, REJECTED, MANUAL\_REVIEW, RETRYING, FAILED |
| RETRYING | PROCESSING, FAILED |
| MANUAL\_REVIEW | APPROVED, REJECTED |
| APPROVED | COMPLETED |
| REJECTED | COMPLETED |
| FAILED | RETRYING, where permitted |
| COMPLETED | None |

## **10.2 Transition Service**

```
async function transitionRequest(
  requestId: string,
  newStatus: RequestStatus,
  reason: string,
  actorId?: string
) {
  // 1. Load current request status.
  // 2. Check transition against allowed transition map.
  // 3. Reject invalid transitions.
  // 4. Update request status.
  // 5. Insert StateTransition record.
  // 6. Insert AuditLog record.
  // 7. Commit all changes together.
}
```

The status update, state transition record, and audit record should be committed in the same Prisma transaction.

---

# **11\. Idempotency Service**

## **11.1 Purpose**

Idempotency prevents duplicate requests when clients retry submissions due to network failures or repeated clicks.

## **11.2 Request Handling**

The client sends:

```
POST /api/v1/requests
Idempotency-Key: unique-client-generated-key
```

The backend calculates a stable hash of the normalized request payload.

### **Behavior**

| Condition | Expected Result |
| ----- | ----- |
| New key | Process request |
| Same key \+ same payload | Return existing request |
| Same key \+ different payload | Return HTTP 409 |
| Concurrent same-key submissions | Only one request is created |

## **11.3 Implementation Strategy**

Use a database unique constraint as the final protection against concurrent duplicate submissions.

Recommended flow:

1. Validate the idempotency key.  
2. Calculate the payload hash.  
3. Attempt to create the idempotency record and request in one transaction.  
4. If a unique constraint conflict occurs, retrieve the existing record.  
5. Compare payload hashes.  
6. Return the existing result or a conflict response.

Do not rely only on an in-memory map because it does not work reliably across multiple server instances or restarts.

---

# **12\. Retry Service**

## **12.1 Purpose**

Retry temporary dependency failures without creating duplicate requests or executions.

## **12.2 Retry Policy**

Default configuration:

```
{
  "maxRetries": 3,
  "initialDelaySeconds": 2,
  "backoffMultiplier": 2
}
```

For the hackathon version, retries may be triggered through an API or a simple background worker.

## **12.3 Retry Logic**

```
async function retryExecution(executionId: string) {
  // 1. Load execution and retry history.
  // 2. Check whether execution is retryable.
  // 3. Check retry count against maximum.
  // 4. Create a retry record.
  // 5. Mark request as RETRYING.
  // 6. Execute the workflow again from the failed stage.
  // 7. Persist the new result.
  // 8. If maximum retries are exceeded, mark as FAILED.
}
```

Only retry transient errors. Validation failures and business-rule rejections must not be retried automatically.

---

# **13\. External Dependency Simulator**

## **13.1 Purpose**

Simulate an external service such as a credit verification provider.

The simulator allows demonstration of:

* Successful dependency calls.  
* Temporary failures.  
* Permanent failures.  
* Timeout scenarios.  
* Retry behavior.

## **13.2 Interface**

```
interface DependencyResult {
  success: boolean;
  message: string;
  retryable: boolean;
}

interface ExternalDependency {
  verify(payload: unknown): Promise<DependencyResult>;
}
```

## **13.3 Simulation Modes**

```
export enum SimulationMode {
  SUCCESS = "SUCCESS",
  TEMPORARY_FAILURE = "TEMPORARY_FAILURE",
  PERMANENT_FAILURE = "PERMANENT_FAILURE"
}
```

An admin or demo configuration can select the mode.

Avoid using actual third-party APIs for the initial implementation. A deterministic simulator makes the project easier to test and demonstrate.

---

# **14\. Audit Logging**

## **14.1 Purpose**

Every important action must be traceable.

## **14.2 Events to Record**

* User login.  
* Request submission.  
* Input validation.  
* Workflow execution started.  
* Rule evaluated.  
* Decision generated.  
* Request status changed.  
* Dependency failure.  
* Retry attempted.  
* Manual review assigned.  
* Manual review completed.  
* Workflow configuration published.

## **14.3 Audit Service Interface**

```
interface AuditService {
  log(input: {
    entityType: string;
    entityId: string;
    action: string;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
```

Audit records should be append-only through application behavior. Do not store sensitive credentials or unnecessary personal data in audit metadata.

---

# **15\. Manual Review Service**

## **15.1 Purpose**

Requests that cannot be automatically approved or rejected are sent for human review.

## **15.2 Workflow**

```
Rule Evaluation
      |
      v
MANUAL_REVIEW
      |
      v
Create Review Record
      |
      v
Reviewer Opens Request
      |
      v
Reviewer Decision
    /       \
APPROVE     REJECT
   |           |
   v           v
COMPLETED   COMPLETED
```

## **15.3 Review Actions**

A reviewer can:

* View submitted request data.  
* View failed rules and decision explanation.  
* Add comments.  
* Approve the request.  
* Reject the request.

The review decision, reviewer ID, comment, status transition, and audit record must be persisted together.

---

# **16\. Authentication and Authorization**

## **16.1 Authentication Flow**

1. User submits email and password.  
2. Backend retrieves the user.  
3. Password is checked using bcrypt.  
4. JWT is generated.  
5. Client receives the token.  
6. Protected routes validate the token.

## **16.2 Authorization Matrix**

| Feature | ADMIN | OPERATOR | REVIEWER | VIEWER |
| ----- | ----- | ----- | ----- | ----- |
| Dashboard | Yes | Yes | Yes | Yes |
| Submit Request | Yes | Yes | No | No |
| View Requests | Yes | Yes | Yes | Yes |
| Configure Workflow | Yes | No | No | No |
| Retry Execution | Yes | Yes | No | No |
| Manual Review | Yes | No | Yes | No |
| View Audit Logs | Yes | Limited | Limited | Yes |

Authorization must be enforced by backend middleware and service-level checks, not just by hiding frontend controls.

---

# **17\. REST API Implementation**

All endpoints use the `/api/v1` prefix.

## **17.1 Authentication**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| POST | /auth/login | Login |
| GET | /auth/me | Current user |

## **17.2 Requests**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| POST | /requests | Submit request |
| GET | /requests | List requests |
| GET | /requests/ | Request details |
| GET | /requests//history | Request history |

## **17.3 Workflows**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /workflows | List workflows |
| POST | /workflows | Create workflow |
| GET | /workflows/ | Workflow details |
| PUT | /workflows/ | Update draft configuration |
| POST | /workflows//publish | Publish new version |

## **17.4 Executions**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /executions/ | Execution details |
| POST | /executions//retry | Retry execution |

## **17.5 Manual Review**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /reviews | Pending reviews |
| GET | /reviews/ | Review details |
| POST | /reviews//decision | Submit review decision |

## **17.6 Audit and Dashboard**

| Method | Endpoint | Purpose |
| ----- | ----- | ----- |
| GET | /audit | Audit history |
| GET | /dashboard/summary | Dashboard metrics |

## **17.7 Standard Response Format**

Success:

```
{
  "success": true,
  "message": "Request submitted successfully",
  "data": {
    "requestId": "request-id",
    "status": "RECEIVED"
  }
}
```

Failure:

```
{
  "success": false,
  "message": "Invalid request data",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

---

# **18\. Error Handling**

Use centralized error handling.

## **18.1 Error Classes**

```
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
```

## **18.2 Error Codes**

| Code | HTTP Status |
| ----- | ----- |
| VALIDATION\_ERROR | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT\_FOUND | 404 |
| DUPLICATE\_REQUEST | 409 |
| INVALID\_TRANSITION | 409 |
| DEPENDENCY\_FAILURE | 503 |
| MAX\_RETRIES\_EXCEEDED | 409 |
| INTERNAL\_ERROR | 500 |

Unexpected errors must be logged without exposing stack traces or secrets to clients.

---

# **19\. Frontend Implementation Details**

## **19.1 Pages**

```
frontend/src/
├── components/
│   ├── layout/
│   ├── common/
│   ├── requests/
│   ├── workflows/
│   ├── executions/
│   └── audit/
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Requests.tsx
│   ├── RequestDetails.tsx
│   ├── WorkflowList.tsx
│   ├── WorkflowEditor.tsx
│   ├── ExecutionDetails.tsx
│   ├── ManualReviews.tsx
│   └── AuditLogs.tsx
│
├── services/
│   ├── api.ts
│   ├── auth.api.ts
│   ├── request.api.ts
│   ├── workflow.api.ts
│   └── execution.api.ts
│
├── hooks/
├── context/
├── types/
├── utils/
└── App.tsx
```

## **19.2 Dashboard**

Display:

* Total requests.  
* Approved requests.  
* Rejected requests.  
* Pending manual reviews.  
* Failed executions.  
* Retry attempts.  
* Recent request activity.

## **19.3 Request Details**

Display:

* Request reference number.  
* Submitted information.  
* Current status.  
* Workflow version.  
* Execution stages.  
* Rule evaluation results.  
* Decision explanation.  
* Audit history.  
* Retry action, if permitted.

## **19.4 Workflow Editor**

The workflow editor should allow an admin to:

* Create a workflow.  
* Add rules.  
* Select a field.  
* Select an operator.  
* Enter a comparison value.  
* Set rule priority.  
* Configure failure actions.  
* Save a draft.  
* Publish a new version.

For the initial implementation, use a structured form-based editor rather than a complex visual drag-and-drop builder.

---

# **20\. Transaction and Consistency Requirements**

The following operations must use Prisma transactions:

| Operation | Transaction Requirement |
| ----- | ----- |
| Create request and initial execution | Required |
| Create idempotency record and request | Required |
| Change status and create transition | Required |
| Change status and create audit event | Required |
| Record manual review decision | Required |
| Publish workflow version | Required |
| Record retry attempt and update retry state | Required |

External dependency calls must happen outside database transactions.

Use database constraints and conditional updates to prevent concurrent processing of the same execution.

---

# **21\. Testing Strategy**

## **21.1 Unit Tests**

Test:

* Rule evaluator operators.  
* Rule priority.  
* Decision generation.  
* State transition validation.  
* Retry eligibility.  
* Payload hashing.  
* Workflow configuration validation.

## **21.2 Integration Tests**

Test:

* Login.  
* Request submission.  
* Duplicate request handling.  
* Workflow execution.  
* Rule rejection.  
* Manual review.  
* Dependency failure.  
* Retry success.  
* Audit history.  
* Workflow version pinning.

## **21.3 Required Scenarios**

| Test ID | Scenario | Expected Result |
| ----- | ----- | ----- |
| TC-01 | Valid application | Request accepted |
| TC-02 | Invalid email | Validation failure |
| TC-03 | Applicant below minimum age | Rejection |
| TC-04 | High credit score | Automatic approval path |
| TC-05 | Medium credit score | Manual review |
| TC-06 | Duplicate key, same payload | Existing request returned |
| TC-07 | Duplicate key, different payload | HTTP 409 |
| TC-08 | Dependency temporary failure | Retry initiated |
| TC-09 | Dependency succeeds after retry | Execution completes |
| TC-10 | Maximum retries exceeded | Execution fails |
| TC-11 | Reviewer approves | Request completed |
| TC-12 | Reviewer rejects | Request completed |
| TC-13 | Invalid state transition | Transition rejected |
| TC-14 | Workflow configuration updated | New version published |
| TC-15 | Existing execution after publication | Original version retained |
| TC-16 | Unauthorized workflow update | HTTP 403 |

---

# **22\. Performance and Security Considerations**

## **22.1 Performance**

* Add indexes on frequently queried status and timestamp fields.  
* Paginate request and audit endpoints.  
* Avoid loading unnecessary JSONB data.  
* Use database-level constraints.  
* Keep rule evaluation deterministic and lightweight.  
* Avoid unnecessary external API calls.

## **22.2 Security**

* Hash passwords using bcrypt.  
* Store JWT secrets in environment variables.  
* Validate and sanitize all input.  
* Enforce role-based access.  
* Avoid logging sensitive applicant information.  
* Restrict workflow editing to admins.  
* Protect audit history from normal user modification.  
* Apply appropriate request body size limits.

---

# **23\. Implementation Priority**

To complete the hackathon project efficiently, implement in this order.

| Priority | Module | Expected Outcome |
| ----- | ----- | ----- |
| P0 | Project setup and database | Application runs |
| P0 | Authentication | Login works |
| P0 | Request submission | Requests stored |
| P0 | Workflow configuration | Rules configurable |
| P0 | Rule engine | Decisions generated |
| P0 | Execution engine | End-to-end workflow works |
| P0 | Audit history | Actions traceable |
| P1 | Idempotency | Duplicate submissions prevented |
| P1 | Dependency simulator | Failures reproducible |
| P1 | Retry service | Retry flow works |
| P1 | Manual review | Human decision works |
| P1 | Dashboard | Metrics displayed |
| P2 | Workflow editor improvements | Better configurability |
| P2 | Advanced visualizations | Better presentation |

P0 and P1 features are the core demonstration requirements. P2 features should only be implemented if time remains.

---

# **24\. Definition of Implementation Complete**

FlowGuard is considered implementation-complete when:

1. The application starts using documented commands.  
2. Users can log in with role-based access.  
3. An admin can configure and publish a workflow.  
4. An operator can submit a business request.  
5. The system validates request data.  
6. The rule engine evaluates configurable rules.  
7. Decisions include an explanation and rule trace.  
8. Requests follow valid lifecycle transitions.  
9. Duplicate requests are handled idempotently.  
10. External dependency failures can be simulated.  
11. Retry functionality works.  
12. Manual review can be completed.  
13. Audit history records important actions.  
14. Required tests pass.  
15. README documents setup, API usage, architecture, and demonstration steps.

---

# **25\. Instructions for Antigravity**

Use this document together with:

* `docs/PRD.md`  
* `docs/TRD.md`  
* `docs/SRS.md`  
* `docs/HLD.md`  
* `docs/LLD.md`

Implementation instructions:

1. Read all project documents before writing code.  
2. Treat PRD as the source of product requirements.  
3. Treat TRD as the source of technology decisions.  
4. Treat SRS as the source of functional and acceptance requirements.  
5. Treat HLD as the source of system architecture.  
6. Treat LLD as the implementation guide.  
7. Do not replace the selected technology stack.  
8. Do not implement arbitrary code execution for workflow rules.  
9. Do not hardcode business thresholds in the execution engine.  
10. Keep workflow configurations versioned.  
11. Implement core backend functionality before polishing the frontend.  
12. Write tests alongside important business logic.  
13. Ensure all required scenarios can be demonstrated.  
14. Update README with actual setup and run instructions.  
15. Do not claim a feature is complete until it has been implemented and tested.

**Final objective:** Deliver a working, configurable, explainable, and fault-tolerant workflow decision platform rather than a static CRUD application.

---

**End of LLD v1.0**

