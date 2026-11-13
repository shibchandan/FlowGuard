# **FlowGuard – Database Design Document**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** Database Design  
**Version:** 1.0  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Backend:** Node.js \+ Express \+ TypeScript

---

# **1\. Database Design Objectives**

The database must support:

1. User authentication and role-based access.  
2. Configurable workflow definitions.  
3. Version-controlled workflow configurations.  
4. Dynamic business rules.  
5. Business request submissions.  
6. Workflow execution tracking.  
7. Request lifecycle management.  
8. Complete audit history.  
9. Duplicate request prevention through idempotency.  
10. Retry and failure management.  
11. Manual review and approval.  
12. Decision explanations and rule evaluation traces.

## **1.1 Database Strategy**

Use a relational database with PostgreSQL.

Use:

* Relational columns for frequently queried fields.  
* JSONB for flexible workflow configurations and request data.  
* Foreign keys for referential integrity.  
* Unique constraints for duplicate prevention.  
* Indexes for frequently accessed data.  
* Database transactions for important state changes.

---

# **2\. Entity Relationship Diagram**

```
erDiagram
    USER ||--o{ REQUEST : submits
    USER ||--o{ AUDIT_LOG : performs
    USER ||--o{ WORKFLOW_VERSION : publishes
    USER ||--o{ MANUAL_REVIEW : reviews

    WORKFLOW_DEFINITION ||--o{ WORKFLOW_VERSION : contains
    WORKFLOW_DEFINITION ||--o{ REQUEST : processes

    REQUEST ||--o{ WORKFLOW_EXECUTION : has
    WORKFLOW_VERSION ||--o{ WORKFLOW_EXECUTION : uses

    REQUEST ||--o{ STATE_TRANSITION : records
    WORKFLOW_EXECUTION ||--o{ STATE_TRANSITION : produces

    WORKFLOW_EXECUTION ||--o{ RETRY_RECORD : retries

    REQUEST ||--o{ MANUAL_REVIEW : requires

    REQUEST ||--o{ IDEMPOTENCY_RECORD : protected_by

    REQUEST ||--o{ AUDIT_LOG : generates
    WORKFLOW_EXECUTION ||--o{ AUDIT_LOG : generates
```

---

# **3\. Database Tables**

## **3.1 User**

Stores platform users and their access roles.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password\_hash | TEXT | NOT NULL |
| role | ENUM | NOT NULL |
| is\_active | BOOLEAN | DEFAULT TRUE |
| created\_at | TIMESTAMP | NOT NULL |
| updated\_at | TIMESTAMP | NOT NULL |

### **Roles**

* ADMIN  
* OPERATOR  
* REVIEWER  
* VIEWER

---

## **3.2 WorkflowDefinition**

Stores the main workflow information.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| is\_active | BOOLEAN | DEFAULT TRUE |
| created\_at | TIMESTAMP | NOT NULL |
| updated\_at | TIMESTAMP | NOT NULL |

Example:

| id | name | is\_active |
| ----- | ----- | ----- |
| UUID-001 | Loan Application Approval | TRUE |
| UUID-002 | Employee Onboarding | TRUE |

---

## **3.3 WorkflowVersion**

Stores immutable published workflow configurations.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| workflow\_id | UUID | Foreign Key |
| version | INTEGER | NOT NULL |
| configuration | JSONB | NOT NULL |
| status | ENUM | NOT NULL |
| published\_by | UUID | Foreign Key, NULL |
| published\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP | NOT NULL |

### **Version Status**

* DRAFT  
* PUBLISHED  
* ARCHIVED

### **Important Constraints**

* Unique `(workflow_id, version)`.  
* Published versions must not be edited in place.  
* New changes must create a new version.  
* Every execution references the exact version it uses.

Example configuration:

```
{
  "workflowName": "Loan Application Approval",
  "inputSchema": {
    "applicantName": "string",
    "age": "number",
    "creditScore": "number",
    "monthlyIncome": "number",
    "requestedAmount": "number"
  },
  "rules": [
    {
      "id": "RULE_001",
      "field": "age",
      "operator": "GTE",
      "value": 18,
      "priority": 1,
      "failureAction": "REJECT"
    },
    {
      "id": "RULE_002",
      "field": "creditScore",
      "operator": "GTE",
      "value": 750,
      "priority": 2,
      "failureAction": "MANUAL_REVIEW"
    }
  ]
}
```

---

## **3.4 Request**

Stores all business requests submitted to FlowGuard.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| reference\_number | VARCHAR(50) | UNIQUE, NOT NULL |
| workflow\_id | UUID | Foreign Key |
| submitted\_by | UUID | Foreign Key |
| status | ENUM | NOT NULL |
| input\_data | JSONB | NOT NULL |
| created\_at | TIMESTAMP | NOT NULL |
| updated\_at | TIMESTAMP | NOT NULL |

### **Request Status**

* RECEIVED  
* VALIDATED  
* PROCESSING  
* APPROVED  
* REJECTED  
* MANUAL\_REVIEW  
* RETRYING  
* COMPLETED  
* FAILED

### **Example Request Data**

```
{
  "applicantName": "Rahul Sharma",
  "email": "rahul@example.com",
  "age": 25,
  "creditScore": 780,
  "monthlyIncome": 45000,
  "requestedAmount": 300000
}
```

The actual input data depends on the selected workflow.

---

## **3.5 WorkflowExecution**

Tracks each execution of a submitted request.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| request\_id | UUID | Foreign Key |
| workflow\_version\_id | UUID | Foreign Key |
| status | ENUM | NOT NULL |
| current\_stage | VARCHAR(50) | NULL |
| decision | ENUM | NULL |
| decision\_reason | TEXT | NULL |
| rule\_trace | JSONB | NULL |
| started\_at | TIMESTAMP | NULL |
| completed\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP | NOT NULL |

### **Execution Status**

* RUNNING  
* APPROVED  
* REJECTED  
* MANUAL\_REVIEW  
* RETRY  
* COMPLETED  
* FAILED

### **Decision Values**

* APPROVED  
* REJECTED  
* MANUAL\_REVIEW  
* PENDING

The `rule_trace` field stores the explanation of the decision.

Example:

```
{
  "evaluations": [
    {
      "ruleId": "RULE_001",
      "ruleName": "Minimum Age",
      "passed": true,
      "actualValue": 25,
      "expectedValue": 18,
      "operator": "GTE",
      "message": "Minimum age requirement satisfied"
    },
    {
      "ruleId": "RULE_002",
      "ruleName": "Credit Score",
      "passed": true,
      "actualValue": 780,
      "expectedValue": 750,
      "operator": "GTE",
      "message": "Credit score meets approval threshold"
    }
  ]
}
```

---

## **3.6 StateTransition**

Stores every request status change.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| request\_id | UUID | Foreign Key |
| execution\_id | UUID | Foreign Key, NULL |
| from\_status | VARCHAR(50) | NULL |
| to\_status | VARCHAR(50) | NOT NULL |
| reason | TEXT | NULL |
| changed\_by | UUID | Foreign Key, NULL |
| created\_at | TIMESTAMP | NOT NULL |

Example:

| From | To | Reason |
| ----- | ----- | ----- |
| RECEIVED | VALIDATED | Input validation successful |
| VALIDATED | PROCESSING | Execution started |
| PROCESSING | MANUAL\_REVIEW | Credit score requires review |
| MANUAL\_REVIEW | APPROVED | Reviewer approved |
| APPROVED | COMPLETED | Workflow completed |

This table provides a chronological history of the request lifecycle.

---

## **3.7 AuditLog**

Stores important system activities.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| entity\_type | VARCHAR(50) | NOT NULL |
| entity\_id | UUID | NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| actor\_id | UUID | Foreign Key, NULL |
| metadata | JSONB | NULL |
| created\_at | TIMESTAMP | NOT NULL |

Example:

```
{
  "entityType": "REQUEST",
  "entityId": "UUID-001",
  "action": "REQUEST_APPROVED",
  "actorId": "USER-001",
  "metadata": {
    "previousStatus": "MANUAL_REVIEW",
    "newStatus": "APPROVED",
    "reason": "Reviewer approved application"
  }
}
```

Audit logs should be append-only through application behavior.

---

## **3.8 IdempotencyRecord**

Prevents duplicate request creation.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| idempotency\_key | VARCHAR(255) | NOT NULL |
| request\_hash | VARCHAR(255) | NOT NULL |
| request\_id | UUID | Foreign Key |
| created\_at | TIMESTAMP | NOT NULL |
| expires\_at | TIMESTAMP | NULL |

### **Important Constraint**

Unique constraint:

`(idempotency_key)`

For a multi-tenant or multi-client deployment, scope the key by the authenticated client or user and enforce uniqueness on the composite scope.

### **Behavior**

| Situation | Result |
| ----- | ----- |
| New key | Create request |
| Same key, same payload | Return existing request |
| Same key, different payload | Return HTTP 409 |
| Concurrent duplicate submissions | Only one request created |

---

## **3.9 RetryRecord**

Tracks failed execution attempts.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| execution\_id | UUID | Foreign Key |
| attempt\_number | INTEGER | NOT NULL |
| reason | TEXT | NULL |
| status | ENUM | NOT NULL |
| next\_retry\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP | NOT NULL |

### **Retry Status**

* PENDING  
* RUNNING  
* SUCCESS  
* FAILED  
* CANCELLED

### **Constraints**

Unique constraint:

`(execution_id, attempt_number)`

---

## **3.10 ManualReview**

Stores requests requiring human intervention.

| Column | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| request\_id | UUID | Foreign Key |
| assigned\_to | UUID | Foreign Key, NULL |
| review\_status | ENUM | NOT NULL |
| reviewer\_comment | TEXT | NULL |
| reviewed\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP | NOT NULL |

### **Review Status**

* PENDING  
* APPROVED  
* REJECTED

---

# **4\. Relationship Summary**

| Parent Table | Child Table | Relationship |
| ----- | ----- | ----- |
| User | Request | One-to-Many |
| User | AuditLog | One-to-Many |
| User | WorkflowVersion | One-to-Many |
| WorkflowDefinition | WorkflowVersion | One-to-Many |
| WorkflowDefinition | Request | One-to-Many |
| Request | WorkflowExecution | One-to-Many |
| WorkflowVersion | WorkflowExecution | One-to-Many |
| Request | StateTransition | One-to-Many |
| WorkflowExecution | RetryRecord | One-to-Many |
| Request | ManualReview | One-to-Many |
| Request | IdempotencyRecord | One-to-Many |

**Design note:** Multiple executions per request allow controlled re-execution while preserving the history of previous attempts. The normal retry flow should continue the same execution unless an explicit new execution is created.

---

# **5\. Indexing Strategy**

Create indexes on frequently queried columns.

| Table | Index |
| ----- | ----- |
| User | email |
| Request | reference\_number |
| Request | status |
| Request | workflow\_id |
| Request | created\_at |
| WorkflowVersion | workflow\_id, version |
| WorkflowExecution | request\_id |
| WorkflowExecution | status |
| StateTransition | request\_id, created\_at |
| AuditLog | entity\_type, entity\_id |
| AuditLog | created\_at |
| IdempotencyRecord | idempotency\_key |
| RetryRecord | execution\_id, attempt\_number |
| ManualReview | review\_status |
| ManualReview | assigned\_to |

Use composite indexes where they match actual query patterns.

---

# **6\. Prisma Schema Implementation**

The following is a baseline schema for the project. Antigravity should validate it against the installed Prisma version and generate migrations from it.

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
  REVIEWER
  VIEWER
}

enum RequestStatus {
  RECEIVED
  VALIDATED
  PROCESSING
  APPROVED
  REJECTED
  MANUAL_REVIEW
  RETRYING
  COMPLETED
  FAILED
}

enum ExecutionStatus {
  RUNNING
  APPROVED
  REJECTED
  MANUAL_REVIEW
  RETRY
  COMPLETED
  FAILED
}

enum Decision {
  APPROVED
  REJECTED
  MANUAL_REVIEW
  PENDING
}

enum WorkflowVersionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum RetryStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id             String            @id @default(uuid()) @db.Uuid
  name           String
  email          String            @unique
  passwordHash   String
  role           UserRole          @default(OPERATOR)
  isActive       Boolean           @default(true)
  requests       Request[]
  auditLogs      AuditLog[]
  publishedVersions WorkflowVersion[] @relation("PublishedBy")
  assignedReviews ManualReview[]   @relation("AssignedReviews")
  transitions    StateTransition[] @relation("TransitionActor")
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}

model WorkflowDefinition {
  id          String            @id @default(uuid()) @db.Uuid
  name        String
  description String?
  isActive    Boolean           @default(true)
  versions    WorkflowVersion[]
  requests    Request[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model WorkflowVersion {
  id            String                @id @default(uuid()) @db.Uuid
  workflowId    String                @db.Uuid
  version       Int
  configuration Json
  status        WorkflowVersionStatus @default(DRAFT)
  publishedBy   String?               @db.Uuid
  publishedAt   DateTime?
  workflow      WorkflowDefinition    @relation(fields: [workflowId], references: [id])
  publisher     User?                 @relation("PublishedBy", fields: [publishedBy], references: [id])
  executions    WorkflowExecution[]
  createdAt     DateTime              @default(now())

  @@unique([workflowId, version])
  @@index([workflowId, status])
}

model Request {
  id             String             @id @default(uuid()) @db.Uuid
  referenceNumber String            @unique
  workflowId     String             @db.Uuid
  submittedBy    String             @db.Uuid
  status         RequestStatus      @default(RECEIVED)
  inputData      Json
  workflow       WorkflowDefinition @relation(fields: [workflowId], references: [id])
  submitter      User               @relation(fields: [submittedBy], references: [id])
  executions     WorkflowExecution[]
  transitions    StateTransition[]
  auditLogs      AuditLog[]
  idempotencyRecords IdempotencyRecord[]
  reviews        ManualReview[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([status, createdAt])
  @@index([workflowId])
  @@index([submittedBy])
}

model WorkflowExecution {
  id                String          @id @default(uuid()) @db.Uuid
  requestId         String          @db.Uuid
  workflowVersionId String          @db.Uuid
  status            ExecutionStatus @default(RUNNING)
  currentStage      String?
  decision          Decision?
  decisionReason    String?
  ruleTrace         Json?
  startedAt         DateTime        @default(now())
  completedAt       DateTime?
  request           Request         @relation(fields: [requestId], references: [id])
  workflowVersion   WorkflowVersion @relation(fields: [workflowVersionId], references: [id])
  transitions       StateTransition[]
  retries           RetryRecord[]
  auditLogs         AuditLog[]
  createdAt         DateTime        @default(now())

  @@index([requestId])
  @@index([status, createdAt])
}

model StateTransition {
  id          String            @id @default(uuid()) @db.Uuid
  requestId   String            @db.Uuid
  executionId String?           @db.Uuid
  fromStatus  String?
  toStatus    String
  reason      String?
  changedBy   String?           @db.Uuid
  request     Request           @relation(fields: [requestId], references: [id])
  execution   WorkflowExecution? @relation(fields: [executionId], references: [id])
  actor       User?             @relation("TransitionActor", fields: [changedBy], references: [id])
  createdAt   DateTime          @default(now())

  @@index([requestId, createdAt])
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  entityType String
  entityId   String   @db.Uuid
  action     String
  actorId    String?  @db.Uuid
  metadata   Json?
  user       User?    @relation(fields: [actorId], references: [id])
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([actorId, createdAt])
}

model IdempotencyRecord {
  id             String   @id @default(uuid()) @db.Uuid
  idempotencyKey String   @unique
  requestHash    String
  requestId      String   @db.Uuid
  request        Request  @relation(fields: [requestId], references: [id])
  createdAt      DateTime @default(now())
  expiresAt      DateTime?

  @@index([requestId])
}

model RetryRecord {
  id            String     @id @default(uuid()) @db.Uuid
  executionId   String     @db.Uuid
  attemptNumber Int
  reason        String?
  status        RetryStatus @default(PENDING)
  nextRetryAt   DateTime?
  execution     WorkflowExecution @relation(fields: [executionId], references: [id])
  createdAt     DateTime   @default(now())

  @@unique([executionId, attemptNumber])
  @@index([status, nextRetryAt])
}

model ManualReview {
  id              String       @id @default(uuid()) @db.Uuid
  requestId       String       @db.Uuid
  assignedTo      String?      @db.Uuid
  reviewStatus    ReviewStatus @default(PENDING)
  reviewerComment String?
  reviewedAt      DateTime?
  request         Request      @relation(fields: [requestId], references: [id])
  reviewer        User?        @relation("AssignedReviews", fields: [assignedTo], references: [id])
  createdAt       DateTime     @default(now())

  @@index([reviewStatus, createdAt])
  @@index([assignedTo, reviewStatus])
}
```

---

# **7\. Important Database Design Decisions**

## **7.1 Why JSONB?**

Workflow configurations and submitted request fields can vary by use case.

For example:

* Loan application has credit score and income.  
* Employee onboarding has employee ID and department.  
* Vendor approval has company registration and tax information.

JSONB avoids creating separate database tables for every workflow type.

## **7.2 Why Workflow Versioning?**

Suppose an admin changes the credit score threshold from 750 to 780\.

Existing executions must continue using the version under which they started. New requests should use the latest published version.

Therefore, every execution stores `workflowVersionId`.

## **7.3 Why Separate Request and Execution Tables?**

A request represents the business submission.

An execution represents processing of that submission.

Separating them allows the system to retain the request even when processing fails or needs to be run again.

## **7.4 Why Separate AuditLog and StateTransition?**

StateTransition tracks lifecycle changes.

AuditLog tracks all significant activities, including actions that do not change request status.

This separation makes history queries clearer.

---

# **8\. Critical Consistency Rules**

1. Request creation and initial execution creation must be atomic.  
2. Idempotency record creation must be atomic with request creation.  
3. State updates and corresponding transition records must be atomic.  
4. Manual review decisions and corresponding audit events must be atomic.  
5. Published workflow versions must be immutable.  
6. Retry records must have unique attempt numbers.  
7. External dependency calls must not run inside database transactions.  
8. Concurrent execution attempts must be protected using conditional updates or database locking.  
9. Audit logs should not be silently overwritten or deleted.  
10. All timestamps should be stored in UTC.

---

# **9\. Seed Data**

The initial seed should create:

### **Admin user**

* Email: `admin@flowguard.local`  
* Password: Set through an environment variable or documented local development seed configuration.  
* Role: ADMIN

### **Sample workflow**

* Name: Loan Application Approval  
* Version: 1  
* Status: PUBLISHED

### **Sample rules**

| Rule | Condition | Failure Action |
| ----- | ----- | ----- |
| Minimum Age | age \>= 18 | REJECT |
| Credit Score | creditScore \>= 750 | MANUAL\_REVIEW |
| Minimum Income | monthlyIncome \>= 25000 | MANUAL\_REVIEW |

The sample rules are demonstration defaults and should be configurable through the workflow editor.

Do not hardcode production credentials.

---

# **10\. Migration and Setup Commands**

```
# Generate Prisma client
npx prisma generate

# Create development migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Open database browser
npx prisma studio
```

---

# **11\. Database Acceptance Checklist**

* PostgreSQL connection works.  
* Prisma schema validates.  
* Initial migration succeeds.  
* Seed data is created.  
* User authentication records persist.  
* Workflow configurations persist.  
* Workflow versions are retained.  
* Requests are stored correctly.  
* Executions reference workflow versions.  
* Rule traces are stored.  
* State transitions are recorded.  
* Audit history is available.  
* Duplicate submissions are prevented.  
* Retry attempts are recorded.  
* Manual reviews are stored.  
* Database transactions protect critical updates.  
* Required indexes and unique constraints exist.

---

# **12\. Instructions for Antigravity**

1. Read this database design along with PRD, TRD, SRS, HLD, and LLD.  
2. Implement the Prisma schema.  
3. Validate all relations and enums.  
4. Generate the initial migration.  
5. Create the seed script.  
6. Verify database connectivity.  
7. Test request creation and execution persistence.  
8. Test idempotency under duplicate submissions.  
9. Test workflow version immutability.  
10. Test transaction consistency.  
11. Do not create additional tables without a clear requirement.  
12. If implementation details conflict with this document, identify the conflict and resolve it before changing the schema.

**Final objective:** Maintain a consistent, versioned, auditable database that supports configurable workflow execution and reliable failure handling.

---

**End of Database Design v1.0**

