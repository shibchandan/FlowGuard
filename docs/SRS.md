# **FlowGuard**

## **Software Requirements Specification (SRS)**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** Software Requirements Specification  
**Version:** 1.0  
**Status:** Development Ready  
**Reference Documents:** PRD v2.0, TRD v2.0  
**Purpose:** ScoreMe Recruitment Hackathon

---

# **1\. Introduction**

## **1.1 Purpose**

This document defines the functional and non-functional requirements of FlowGuard.

It specifies how the system should behave, how users interact with it, how workflows are executed, how business rules are evaluated, and how failures are handled.

The document will be used as a reference for:

* Backend development.  
* Frontend development.  
* Database implementation.  
* API development.  
* Testing and validation.  
* Antigravity AI-assisted development.

## **1.2 Product Scope**

FlowGuard is a configurable workflow decision platform that automates business processes through configurable workflows and business rules.

The initial implementation will demonstrate an Application Approval workflow.

The underlying platform must support different workflow types without requiring major changes to the workflow engine.

## **1.3 Intended Audience**

* Developers.  
* Software architects.  
* Test engineers.  
* Project evaluators.  
* AI development tools.

## **1.4 Definitions**

| Term | Meaning |
| ----- | ----- |
| Workflow | A sequence of configurable processing stages |
| Rule | A configurable business condition |
| Execution | One run of a workflow |
| Request | An input submitted for processing |
| Idempotency | Preventing duplicate processing |
| Audit Log | Historical record of system activity |
| Retry | Reattempting an eligible failed operation |
| Manual Review | Human intervention in a workflow |
| Workflow Version | A published configuration revision |
| State Transition | Movement from one workflow state to another |

---

# **2\. Overall System Description**

## **2.1 Product Perspective**

FlowGuard will operate as a web-based application consisting of:

1. React frontend.  
2. Node.js and Express backend.  
3. PostgreSQL database.  
4. Prisma ORM.  
5. Configurable workflow engine.  
6. Configurable rules engine.  
7. External dependency simulator.

## **2.2 User Classes**

### **Administrator**

* Manage workflows.  
* Configure business rules.  
* Publish workflow versions.  
* Manage platform users.

### **Operator**

* Submit requests.  
* Monitor processing.  
* View request details.  
* Track execution results.

### **Reviewer**

* View manual review cases.  
* Approve or reject pending requests.  
* Add review comments.

### **Viewer**

* View permitted dashboards.  
* View requests and execution history.  
* Cannot modify configurations or decisions.

## **2.3 Operating Environment**

| Component | Technology |
| ----- | ----- |
| Frontend | React \+ TypeScript |
| Build Tool | Vite |
| Backend | Node.js \+ Express \+ TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Testing | Vitest \+ Supertest |
| Deployment | Docker Compose |

## **2.4 System Constraints**

* All business rules must be configurable.  
* Workflow execution must not depend on hardcoded application-specific conditions.  
* Running executions must retain their original workflow version.  
* Duplicate requests must be handled safely.  
* State changes and audit records must remain consistent.  
* Arbitrary JavaScript execution must not be used for rule evaluation.

---

# **3\. Functional Requirements**

Each requirement has a unique identifier and an acceptance condition.

## **3.1 Authentication and Authorization**

### **FR-AUTH-01: User Login**

The system shall allow registered users to log in using their email and password.

**Acceptance criteria:**

* Valid credentials return an authentication token.  
* Invalid credentials return an appropriate error.  
* Passwords must not be stored as plain text.

### **FR-AUTH-02: Role-Based Access**

The system shall support the following roles:

* ADMIN  
* OPERATOR  
* REVIEWER  
* VIEWER

**Acceptance criteria:**

* Administrators can manage workflows and rules.  
* Operators can submit and monitor requests.  
* Reviewers can process assigned manual reviews.  
* Viewers cannot modify workflow configurations or decisions.  
* Unauthorized operations return HTTP 403\.

## **3.2 Request Management**

### **FR-REQ-01: Request Submission**

The system shall accept business requests through the REST API and frontend.

**Acceptance criteria:**

* Each accepted request receives a unique identifier.  
* The request is associated with a valid workflow.  
* The request payload is persisted.  
* The request status is initialized correctly.

### **FR-REQ-02: Request Validation**

The system shall validate submitted request payloads.

**Acceptance criteria:**

* Required fields are checked.  
* Data types are validated.  
* Invalid fields produce meaningful validation errors.  
* Invalid requests do not start workflow execution.

### **FR-REQ-03: Request Retrieval**

The system shall allow authorized users to retrieve request information.

**Acceptance criteria:**

* Users can view request details.  
* Users can search by request identifier.  
* Users can filter by status.  
* Results support pagination.

### **FR-REQ-04: Request History**

The system shall display the lifecycle history of a request.

**Acceptance criteria:**

* All persisted state transitions are visible.  
* Each transition includes a timestamp.  
* Each transition includes its reason where applicable.

## **3.3 Workflow Configuration**

### **FR-WF-01: Create Workflow**

The system shall allow administrators to create workflow definitions.

Required information:

* Workflow name.  
* Description.  
* Workflow identifier.  
* Initial configuration.

**Acceptance criteria:**

* Workflow identifiers must be unique.  
* Invalid configurations cannot be published.

### **FR-WF-02: Configure Workflow Stages**

The system shall support configurable workflow stages.

Initial supported stages:

* VALIDATION  
* RULE\_EVALUATION  
* PROCESSING  
* APPROVAL  
* REJECTION  
* MANUAL\_REVIEW  
* RETRY  
* COMPLETED  
* FAILED

**Acceptance criteria:**

* Stages can be defined in configuration.  
* Stage ordering is respected.  
* Invalid transitions are rejected.  
* Terminal stages cannot continue processing.

### **FR-WF-03: Workflow Versioning**

The system shall maintain workflow configuration versions.

**Acceptance criteria:**

* Every published configuration has a version number.  
* A new published configuration creates a new version.  
* Existing executions retain their original version.  
* New executions use the active published version.

### **FR-WF-04: Publish Workflow**

The system shall allow administrators to publish validated workflow configurations.

**Acceptance criteria:**

* Only valid configurations can be published.  
* Published versions are identifiable.  
* Publishing generates an audit event.

## **3.4 Rules Engine**

### **FR-RULE-01: Create Rule**

The system shall allow administrators to create configurable business rules.

A rule must contain:

* Rule identifier.  
* Rule name.  
* Field.  
* Operator.  
* Expected value.  
* Priority.  
* Action.  
* Enabled status.

### **FR-RULE-02: Supported Operators**

The rules engine shall support:

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

### **FR-RULE-03: Rule Evaluation**

The system shall evaluate enabled rules against request data.

**Acceptance criteria:**

* Each rule produces a PASS or FAIL result.  
* Rules are evaluated according to configured priority.  
* Invalid operators are rejected.  
* Disabled rules are not evaluated.  
* The resulting action is recorded.

### **FR-RULE-04: Explainable Rule Results**

The system shall provide explanations for rule evaluations.

Each result shall include:

* Rule name.  
* Field evaluated.  
* Actual value.  
* Expected value.  
* Operator.  
* Evaluation result.  
* Resulting action.

## **3.5 Workflow Execution**

### **FR-EXEC-01: Start Execution**

The system shall initialize workflow execution after successful request validation.

**Acceptance criteria:**

* A unique execution identifier is generated.  
* The workflow version is recorded.  
* The initial state is persisted.  
* The execution is linked to the original request.

### **FR-EXEC-02: Execute Workflow Stages**

The system shall execute workflow stages according to configuration.

**Acceptance criteria:**

* Stage ordering is respected.  
* Conditional transitions are evaluated.  
* Execution results are persisted.  
* Invalid transitions are prevented.

### **FR-EXEC-03: Generate Final Decision**

The system shall generate an appropriate workflow outcome.

Supported outcomes:

* APPROVED  
* REJECTED  
* MANUAL\_REVIEW  
* RETRY  
* FAILED  
* COMPLETED

### **FR-EXEC-04: Execution Details**

The system shall allow authorized users to view execution information.

**Acceptance criteria:**

* Current stage is displayed.  
* Execution status is displayed.  
* Evaluated rules are displayed.  
* Workflow version is displayed.  
* Execution history is accessible.

## **3.6 State Management**

### **FR-STATE-01: State Persistence**

The system shall persist the current state of every execution.

### **FR-STATE-02: State Transition History**

The system shall record every state transition.

Each transition must include:

* Previous state.  
* New state.  
* Timestamp.  
* Reason.  
* Execution identifier.

### **FR-STATE-03: State Validation**

The system shall reject invalid state transitions.

**Acceptance criteria:**

* Only permitted transitions are allowed.  
* Terminal states cannot transition to active processing states without an explicitly supported recovery operation.  
* Invalid transitions do not modify persisted execution state.

## **3.7 Idempotency**

### **FR-IDEM-01: Idempotency Key**

The request submission API shall accept an `Idempotency-Key` header.

### **FR-IDEM-02: Duplicate Detection**

The system shall identify duplicate submissions using the idempotency key.

**Acceptance criteria:**

* Identical repeated submissions do not create additional executions.  
* The original response or current processing status is returned.  
* The same key with a different payload returns HTTP 409\.  
* Concurrent duplicate submissions are handled safely.

### **FR-IDEM-03: Idempotency Persistence**

The system shall persist idempotency records in PostgreSQL.

## **3.8 Failure and Retry Handling**

### **FR-FAIL-01: Dependency Simulation**

The system shall integrate with a simulated external verification service.

The simulator shall support:

* Successful response.  
* Timeout.  
* Temporary failure.  
* Recovery after failure.

### **FR-FAIL-02: Retry Configuration**

The system shall support configurable retry policies.

Configuration must include:

* Maximum attempts.  
* Retryable errors.  
* Retry delay.

### **FR-FAIL-03: Retry Execution**

The system shall retry eligible failed operations.

**Acceptance criteria:**

* Retry attempts are recorded.  
* Retry limits are respected.  
* Successful retries allow workflow continuation.  
* Exhausted retries produce a configured final outcome.

### **FR-FAIL-04: Failure Recording**

The system shall record processing failures.

Failure records shall include:

* Execution identifier.  
* Error type.  
* Error message.  
* Timestamp.  
* Retry attempt where applicable.

## **3.9 Manual Review**

### **FR-REV-01: Manual Review Queue**

The system shall maintain a list of requests requiring human intervention.

### **FR-REV-02: Review Decision**

Authorized reviewers shall be able to approve or reject a pending review.

### **FR-REV-03: Review History**

The system shall record:

* Reviewer identity.  
* Decision.  
* Comment.  
* Timestamp.

### **FR-REV-04: Workflow Continuation**

The workflow shall continue or terminate according to the review decision and configured transitions.

## **3.10 Audit Logging**

### **FR-AUD-01: Event Logging**

The system shall record significant workflow events.

Events include:

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

### **FR-AUD-02: Audit Retrieval**

Authorized users shall be able to retrieve audit history.

### **FR-AUD-03: Audit Integrity**

Audit records shall be append-only at the application level.

Ordinary application users shall not be allowed to modify historical audit events.

## **3.11 Dashboard**

### **FR-DASH-01: Dashboard Statistics**

The dashboard shall display:

* Total requests.  
* Approved requests.  
* Rejected requests.  
* Pending requests.  
* Failed requests.  
* Manual review requests.

### **FR-DASH-02: Recent Activity**

The dashboard shall display recent workflow events.

### **FR-DASH-03: Request Filtering**

The dashboard shall allow users to filter requests by status and search by request identifier.

---

# **4\. External Interface Requirements**

## **4.1 User Interface**

The application shall provide:

1. Login page.  
2. Dashboard.  
3. Request management page.  
4. Request details page.  
5. Workflow management page.  
6. Workflow configuration page.  
7. Rules management page.  
8. Execution monitor.  
9. Audit explorer.  
10. Manual review page.

## **4.2 Software Interfaces**

The frontend shall communicate with the backend using REST APIs over HTTP.

The backend shall communicate with PostgreSQL through Prisma ORM.

The backend shall communicate with the external dependency simulator through a defined service interface.

## **4.3 API Requirements**

Base path:

`/api/v1`

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| POST | /auth/login | User login |
| GET | /auth/me | Current user |
| POST | /requests | Submit request |
| GET | /requests | List requests |
| GET | /requests/ | Request details |
| GET | /requests//history | Request history |
| GET | /workflows | List workflows |
| POST | /workflows | Create workflow |
| GET | /workflows/ | Workflow details |
| PUT | /workflows/ | Update workflow metadata |
| GET | /workflows//versions | List versions |
| POST | /workflows//versions | Create version |
| POST | /workflows//publish | Publish workflow |
| GET | /workflows//rules | List rules |
| POST | /workflows//rules | Create rule |
| PUT | /rules/ | Update rule |
| GET | /executions | List executions |
| GET | /executions/ | Execution details |
| GET | /executions//audit | Execution audit |
| POST | /executions//retry | Retry execution |
| GET | /reviews | List reviews |
| POST | /reviews//approve | Approve review |
| POST | /reviews//reject | Reject review |
| GET | /dashboard/stats | Dashboard statistics |

All APIs shall use consistent response formats and appropriate HTTP status codes.

---

# **5\. Data Requirements**

## **5.1 Core Entities**

The database shall contain the following entities:

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

## **5.2 Data Integrity**

* Every entity shall have a primary key.  
* Related records shall use foreign keys.  
* Workflow identifiers shall be unique.  
* Idempotency keys shall have appropriate uniqueness constraints.  
* Execution records shall reference the workflow version used.  
* Historical audit records shall be preserved.  
* Related state changes shall use database transactions.

## **5.3 Data Retention**

The initial implementation shall retain workflow execution and audit history for the duration of the demonstration environment.

No automatic deletion of historical execution or audit records shall be implemented in the initial version.

---

# **6\. Non-Functional Requirements**

## **6.1 Performance**

**NFR-PERF-01:** The system should return ordinary API responses within 2 seconds under the local demonstration workload, excluding configured retry delays and external dependency timeouts.

**NFR-PERF-02:** Request listing endpoints shall support pagination.

**NFR-PERF-03:** Database queries shall use appropriate indexes for frequently queried fields.

## **6.2 Reliability**

**NFR-REL-01:** Related state changes and audit records shall be persisted consistently.

**NFR-REL-02:** A failed database transaction shall not leave partial committed changes within that transaction.

**NFR-REL-03:** Duplicate requests shall not produce unintended duplicate executions.

**NFR-REL-04:** Temporary dependency failures shall follow configured retry behaviour.

## **6.3 Security**

**NFR-SEC-01:** Passwords shall be hashed using bcrypt.

**NFR-SEC-02:** Protected APIs shall require valid authentication.

**NFR-SEC-03:** Authorization shall be enforced using user roles.

**NFR-SEC-04:** All incoming payloads shall be validated.

**NFR-SEC-05:** Secrets shall be stored in environment variables and not committed to Git.

## **6.4 Maintainability**

**NFR-MAINT-01:** Backend code shall use TypeScript.

**NFR-MAINT-02:** Business logic shall be separated from HTTP controllers.

**NFR-MAINT-03:** Workflow execution and rules evaluation shall be independent modules.

**NFR-MAINT-04:** Database schema changes shall use Prisma migrations.

## **6.5 Scalability**

**NFR-SCALE-01:** New workflow types shall be supported through configuration.

**NFR-SCALE-02:** Workflow execution shall remain modular and independent from request routing.

**NFR-SCALE-03:** The architecture shall allow future integration of background job processing.

## **6.6 Usability**

**NFR-USE-01:** Users shall be able to understand request status and decision explanations.

**NFR-USE-02:** Forms shall display validation errors clearly.

**NFR-USE-03:** Loading, empty, success, and error states shall be represented in the interface.

---

# **7\. Business Rules**

## **BR-01: Mandatory Validation**

A request must pass mandatory validation before workflow execution begins.

## **BR-02: Rule Evaluation**

Only enabled rules associated with the selected workflow version shall be evaluated.

## **BR-03: Rule Priority**

Rules shall be evaluated according to configured priority and documented evaluation behaviour.

## **BR-04: Workflow Version Consistency**

An execution shall continue using the workflow version assigned when it started.

## **BR-05: Idempotency**

A repeated idempotency key with the same request payload shall not create another execution.

## **BR-06: Idempotency Conflict**

A repeated key with a different payload shall produce a conflict response.

## **BR-07: Retry Limit**

A failed operation shall not exceed its configured maximum retry attempts.

## **BR-08: Manual Review**

A request requiring human intervention shall enter the manual review queue.

## **BR-09: Auditability**

Every significant decision and state transition shall generate a corresponding audit record.

## **BR-10: Terminal States**

A completed or rejected execution shall not resume normal processing unless an explicitly supported recovery operation permits it.

---

# **8\. Workflow State Model**

The system shall maintain a controlled state machine.

Initial lifecycle:

```
RECEIVED
    |
    v
VALIDATED
    |
    v
PROCESSING
    |
    +------> APPROVED
    |
    +------> REJECTED
    |
    +------> MANUAL_REVIEW
    |              |
    |              +----> APPROVED
    |              |
    |              +----> REJECTED
    |
    +------> RETRYING
    |              |
    |              +----> PROCESSING
    |              |
    |              +----> FAILED
    |
    +------> COMPLETED
```

The final transition rules shall be validated by the workflow engine.

---

# **9\. Error Handling Requirements**

The system shall return meaningful errors.

| Scenario | Expected HTTP Status |
| ----- | ----- |
| Invalid input | 400 |
| Missing authentication | 401 |
| Insufficient permissions | 403 |
| Resource not found | 404 |
| Idempotency conflict | 409 |
| Unexpected server error | 500 |
| Temporary dependency failure | 502 or 503, depending on the API operation |

Error responses shall include:

* Error code.  
* Human-readable message.  
* Relevant field details when applicable.  
* Request correlation identifier where available.

Internal stack traces and sensitive information shall not be returned to clients.

---

# **10\. Acceptance Testing Requirements**

The following scenarios must be tested before final submission.

| Test ID | Scenario | Expected Result |
| ----- | ----- | ----- |
| TC-01 | Submit valid request | Request accepted |
| TC-02 | Submit invalid request | Validation error |
| TC-03 | Request passes all rules | Approval path |
| TC-04 | Request fails mandatory rule | Rejection path |
| TC-05 | Request meets review condition | Manual review created |
| TC-06 | Submit same idempotency key twice | No duplicate execution |
| TC-07 | Reuse key with different payload | Conflict response |
| TC-08 | Simulate dependency timeout | Retry initiated |
| TC-09 | Retry succeeds | Workflow continues |
| TC-10 | Retry limit exhausted | Failure outcome |
| TC-11 | Attempt invalid state transition | Transition rejected |
| TC-12 | Publish new workflow version | New executions use new version |
| TC-13 | Existing execution after publication | Original version retained |
| TC-14 | Complete workflow transition | Audit record created |
| TC-15 | Database transaction fails | No partial committed transition |
| TC-16 | Unauthorized user changes rule | Access denied |
| TC-17 | Reviewer approves manual case | Review decision recorded |
| TC-18 | Retrieve request history | Complete history returned |

---

# **11\. Traceability Matrix**

| PRD Requirement | SRS Requirement | Verification |
| ----- | ----- | ----- |
| FR-01 Request Intake | FR-REQ-01, FR-REQ-02 | TC-01, TC-02 |
| FR-02 Workflow Configuration | FR-WF-01 to FR-WF-04 | TC-12, TC-13 |
| FR-03 Rules Engine | FR-RULE-01 to FR-RULE-04 | TC-03, TC-04 |
| FR-04 Workflow Execution | FR-EXEC-01 to FR-EXEC-04 | TC-03 to TC-10 |
| FR-05 Lifecycle Management | FR-STATE-01 to FR-STATE-03 | TC-11, TC-18 |
| FR-06 Audit Logging | FR-AUD-01 to FR-AUD-03 | TC-14 |
| FR-07 Explainable Decisions | FR-RULE-04 | TC-03, TC-04 |
| FR-08 Failure and Retry | FR-FAIL-01 to FR-FAIL-04 | TC-08 to TC-10 |
| FR-09 Idempotency | FR-IDEM-01 to FR-IDEM-03 | TC-06, TC-07 |
| FR-10 Manual Review | FR-REV-01 to FR-REV-04 | TC-05, TC-17 |
| FR-11 Dashboard | FR-DASH-01 to FR-DASH-03 | Dashboard integration tests |

---

# **12\. Definition of Done**

A feature shall be considered complete when:

1. Its requirements are implemented.  
2. Input validation is implemented.  
3. Authorization rules are applied where necessary.  
4. Database persistence works.  
5. Appropriate error handling is implemented.  
6. Audit logging is implemented where required.  
7. Automated tests pass.  
8. API documentation is updated.  
9. Frontend integration works where applicable.  
10. The feature is documented in the README when necessary.

---

# **13\. Final System Requirement**

FlowGuard shall operate as a configurable workflow decision platform capable of processing structured requests through versioned workflows and dynamic business rules.

It shall maintain reliable execution states, prevent duplicate processing, handle dependency failures, support retries and manual review, and provide complete audit history with explainable decisions.

The platform must remain configurable and extensible without requiring major changes to its core workflow execution engine.

**End of Document – SRS v1.0**

