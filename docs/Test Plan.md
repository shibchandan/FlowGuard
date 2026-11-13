# **FLOWGUARD – TEST PLAN**

**Project:** FlowGuard – Configurable Workflow Decision Platform  
**Document:** Test Plan  
**Version:** 1.0  
**Status:** Development Baseline  
**Backend:** Node.js, Express, TypeScript  
**Frontend:** React, TypeScript  
**Database:** PostgreSQL with Prisma ORM  
**Testing Framework:** Vitest, Supertest, React Testing Library

---

# **1\. Introduction**

## **1.1 Purpose**

This document defines the testing strategy, scope, test cases, test environment, and acceptance criteria for FlowGuard.

The objective is to ensure that the platform correctly executes configurable workflows, evaluates business rules, handles failures, prevents duplicate processing, supports retries, and maintains a complete audit trail.

## **1.2 Testing Objectives**

* Verify all major functional requirements.  
* Validate workflow configuration and rule evaluation.  
* Ensure reliable request and execution lifecycle management.  
* Verify idempotency and duplicate request prevention.  
* Test external dependency failures and retry mechanisms.  
* Validate manual review functionality.  
* Verify audit logs and explainable decisions.  
* Ensure API security and role-based access control.  
* Validate frontend functionality and usability.  
* Confirm that changes to workflow configurations do not affect existing executions.

# **2\. Testing Scope**

## **2.1 In Scope**

| Module | Testing Coverage |
| ----- | ----- |
| Authentication | Login, JWT validation, authorization |
| Workflow Management | Create, update, version, publish |
| Rule Engine | Operators, conditions, thresholds |
| Request Management | Submission, validation, retrieval |
| Execution Engine | Workflow execution and outcomes |
| State Management | Valid and invalid transitions |
| Idempotency | Duplicate prevention |
| Dependency Simulator | Success, failure, timeout |
| Retry Mechanism | Retry limits and recovery |
| Manual Review | Approval, rejection, comments |
| Audit Logging | Event history and traceability |
| Decision Explanation | Rule results and reasons |
| Dashboard | Summary and activity |
| API | Request/response validation and error handling |

## **2.2 Out of Scope**

* Production-scale load testing.  
* Real third-party financial or verification integrations.  
* Multi-region deployment testing.  
* Advanced penetration testing.  
* Production disaster recovery testing.

These may be considered future enhancements.

# **3\. Testing Strategy**

FlowGuard will follow a layered testing approach.

## **3.1 Unit Testing**

Tests individual functions and components independently.

Examples:

* Rule evaluator.  
* Input validation.  
* State transition validator.  
* Idempotency key validation.  
* Retry eligibility calculation.  
* Decision explanation generator.

**Tools:** Vitest.

## **3.2 Integration Testing**

Tests interactions between modules and infrastructure.

Examples:

* Express API with PostgreSQL.  
* Prisma transactions.  
* Request creation with execution creation.  
* Execution with dependency simulator.  
* Retry with audit logging.  
* Manual review with state updates.

**Tools:** Vitest, Supertest, PostgreSQL test database.

## **3.3 End-to-End Testing**

Tests complete user workflows from the frontend or API.

Examples:

* Login and submit a request.  
* Execute workflow rules.  
* View the decision explanation.  
* Retry a failed execution.  
* Complete manual review.

**Tools:** Playwright (optional), Supertest for API-level end-to-end flows.

## **3.4 Regression Testing**

Run previously successful tests whenever changes are made to:

* Workflow configuration.  
* Rule evaluator.  
* Execution engine.  
* Database schema.  
* State transition logic.  
* API contracts.

# **4\. Test Environment**

| Component | Configuration |
| ----- | ----- |
| Runtime | Node.js LTS |
| Backend | Express \+ TypeScript |
| Frontend | React \+ Vite |
| Database | PostgreSQL |
| ORM | Prisma |
| Unit Tests | Vitest |
| API Tests | Supertest |
| UI Tests | React Testing Library |
| Browser Tests | Playwright (optional) |
| API Documentation | OpenAPI |
| Environment | Local development / Docker Compose |

## **4.1 Test Database**

Use a separate PostgreSQL database for testing.

Requirements:

* Never run automated tests against production data.  
* Reset test data between independent integration test suites.  
* Use deterministic seed data.  
* Use transactions or cleanup utilities where appropriate.  
* Test database constraints and unique indexes.

# **5\. Functional Test Cases**

## **5.1 Authentication and Authorization**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| AUTH-01 | Login with valid credentials | JWT returned |
| AUTH-02 | Login with incorrect password | HTTP 401 |
| AUTH-03 | Access protected API without token | HTTP 401 |
| AUTH-04 | Access API with invalid token | HTTP 401 |
| AUTH-05 | Admin accesses admin functionality | Access granted |
| AUTH-06 | Operator attempts admin-only action | HTTP 403 |
| AUTH-07 | Reviewer accesses review functionality | Access granted |
| AUTH-08 | Viewer attempts to modify workflow | HTTP 403 |

## **5.2 Workflow Management**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| WF-01 | Create workflow with valid configuration | Workflow created |
| WF-02 | Create workflow with missing name | Validation error |
| WF-03 | Create workflow with invalid configuration | HTTP 400 |
| WF-04 | Create a new workflow version | Draft version created |
| WF-05 | Publish valid workflow version | Version published |
| WF-06 | Publish invalid workflow version | Publication rejected |
| WF-07 | Execute using published workflow | Execution uses published version |
| WF-08 | Publish a newer version | Existing executions retain their original version |

## **5.3 Rule Engine**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| RULE-01 | Evaluate EQUALS operator | Correct result |
| RULE-02 | Evaluate NOT\_EQUALS operator | Correct result |
| RULE-03 | Evaluate GT operator | Correct result |
| RULE-04 | Evaluate GTE operator | Correct result |
| RULE-05 | Evaluate LT operator | Correct result |
| RULE-06 | Evaluate LTE operator | Correct result |
| RULE-07 | Evaluate IN operator | Correct result |
| RULE-08 | Evaluate NOT\_IN operator | Correct result |
| RULE-09 | Evaluate EXISTS operator | Correct result |
| RULE-10 | Evaluate NOT\_EXISTS operator | Correct result |
| RULE-11 | Evaluate rule with missing required field | Validation or configured missing-field outcome |
| RULE-12 | Evaluate multiple conditions | Correct combined result |
| RULE-13 | Evaluate unsupported operator | Configuration rejected |
| RULE-14 | Evaluate malformed rule | Configuration rejected |

The evaluator must not execute arbitrary JavaScript supplied through workflow configuration.

## **5.4 Request Management**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| REQ-01 | Submit valid request | Request created |
| REQ-02 | Submit request with missing mandatory field | HTTP 400 |
| REQ-03 | Submit request with incorrect data type | HTTP 400 |
| REQ-04 | Submit request for unknown workflow | HTTP 404 |
| REQ-05 | Submit request for unpublished workflow | Submission rejected |
| REQ-06 | Retrieve existing request | Correct request returned |
| REQ-07 | Retrieve nonexistent request | HTTP 404 |
| REQ-08 | List requests with pagination | Correct paginated response |

## **5.5 Workflow Execution**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| EXE-01 | Execute request meeting approval conditions | Approved |
| EXE-02 | Execute request meeting rejection conditions | Rejected |
| EXE-03 | Execute request meeting manual review conditions | Manual review required |
| EXE-04 | Execute request with multiple rules | Correct decision |
| EXE-05 | Execute request with invalid input | Execution does not proceed |
| EXE-06 | Execute request with valid configuration | Execution completed |
| EXE-07 | Execute request with dependency failure | Failure handled according to configuration |

## **5.6 Idempotency and Duplicate Prevention**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| IDEM-01 | Submit request with new idempotency key | Request created |
| IDEM-02 | Submit same payload with same key | Existing result returned |
| IDEM-03 | Submit different payload with same key | HTTP 409 Conflict |
| IDEM-04 | Submit two concurrent requests with same key | Only one request created |
| IDEM-05 | Submit request with a different key | New request created |
| IDEM-06 | Retry an already completed request | No unintended duplicate execution |

Idempotency must be enforced through database constraints and transactional logic, not only application-level checks.

## **5.7 Dependency Failure and Retry**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| RET-01 | Dependency returns success | Execution continues |
| RET-02 | Dependency returns temporary failure | Failure recorded |
| RET-03 | Retry eligible failed execution | New attempt created |
| RET-04 | Retry exceeds configured limit | Further retry blocked |
| RET-05 | Dependency succeeds after failure | Execution resumes or completes |
| RET-06 | Dependency times out | Timeout recorded |
| RET-07 | Retry an ineligible execution | HTTP 409 or appropriate business error |
| RET-08 | Retry the same attempt concurrently | No duplicate attempt |

The simulator should support deterministic modes such as:

* `SUCCESS`  
* `FAIL`  
* `TIMEOUT`

## **5.8 Manual Review**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| REV-01 | Execution requires manual review | Review item created |
| REV-02 | Reviewer approves request | Request reaches configured approved outcome |
| REV-03 | Reviewer rejects request | Request reaches configured rejected outcome |
| REV-04 | Operator attempts reviewer-only decision | HTTP 403 |
| REV-05 | Reviewer submits invalid decision | HTTP 400 |
| REV-06 | Review decision includes comment | Comment recorded |
| REV-07 | Same review is decided twice | Duplicate decision prevented |

## **5.9 Audit and Explainability**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| AUD-01 | Submit request | Audit event created |
| AUD-02 | Execute workflow | Execution event recorded |
| AUD-03 | Change execution state | State transition recorded |
| AUD-04 | Retry execution | Retry event recorded |
| AUD-05 | Complete manual review | Review decision recorded |
| AUD-06 | Retrieve request history | Complete chronological history returned |
| AUD-07 | Retrieve decision explanation | Rule outcomes and reasons returned |
| AUD-08 | Attempt to modify audit record through API | Modification prohibited |

Each decision explanation should contain:

* Rule identifier and name.  
* Evaluated field.  
* Operator.  
* Expected value.  
* Actual value or safe data reference.  
* Evaluation result.  
* Decision reason.  
* Workflow version used.

Sensitive values should be masked where appropriate.

## **5.10 Dashboard**

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| DASH-01 | Load dashboard | Summary displayed |
| DASH-02 | Display request counts | Counts match database |
| DASH-03 | Display execution outcomes | Correct status breakdown |
| DASH-04 | Display recent activity | Latest events displayed |
| DASH-05 | Load dashboard without data | Empty state displayed |

# **6\. State Transition Testing**

The platform must reject invalid state transitions.

Illustrative execution states:

`PENDING → RUNNING → COMPLETED`

Alternative outcomes:

* `RUNNING → FAILED`  
* `RUNNING → REJECTED`  
* `RUNNING → MANUAL_REVIEW`  
* `FAILED → RETRYING`  
* `RETRYING → RUNNING`  
* `MANUAL_REVIEW → COMPLETED`  
* `MANUAL_REVIEW → REJECTED`

| ID | Test Scenario | Expected Result |
| ----- | ----- | ----- |
| STATE-01 | PENDING to RUNNING | Allowed |
| STATE-02 | RUNNING to COMPLETED | Allowed |
| STATE-03 | RUNNING to FAILED | Allowed |
| STATE-04 | FAILED to RETRYING | Allowed if retry eligible |
| STATE-05 | COMPLETED to RUNNING | Rejected |
| STATE-06 | REJECTED to RETRYING | Rejected unless explicitly supported |
| STATE-07 | Manual review to approved outcome | Allowed through review decision |
| STATE-08 | Invalid state transition | HTTP 409 or appropriate business error |

The exact transition matrix must be implemented centrally and consistently across all APIs.

# **7\. End-to-End Test Scenarios**

## **E2E-01: Successful Application Approval**

1. Admin logs in.  
2. Admin creates an application approval workflow.  
3. Admin configures mandatory fields and approval rules.  
4. Admin publishes the workflow.  
5. Operator submits a valid application.  
6. Workflow executes successfully.  
7. Rule engine evaluates all conditions.  
8. Application receives an approved outcome.  
9. Operator views the decision explanation.  
10. Audit history shows the complete lifecycle.

**Expected:** Request completes with an approved outcome and a complete audit trail.

## **E2E-02: Application Rejection**

1. Submit an application with a credit score below the configured rejection threshold.  
2. Execute the workflow.  
3. Rule engine evaluates the rejection condition.  
4. Request receives a rejected outcome.  
5. View the explanation.

**Expected:** Application is rejected with the correct rule trace.

## **E2E-03: Manual Review**

1. Submit an application meeting manual review conditions.  
2. Workflow creates a review item.  
3. Reviewer logs in.  
4. Reviewer opens the review item.  
5. Reviewer approves or rejects it.  
6. System records the decision.

**Expected:** Request reaches the correct final outcome and the review action is audited.

## **E2E-04: Duplicate Request**

1. Submit a request with an idempotency key.  
2. Submit the same payload again with the same key.  
3. Verify the response.

**Expected:** Existing request is returned. No duplicate request or execution is created.

## **E2E-05: Dependency Failure and Retry**

1. Configure dependency simulator to `FAIL`.  
2. Submit a valid request.  
3. Execute workflow.  
4. Dependency fails.  
5. Execution enters the configured failure state.  
6. Change simulator to `SUCCESS`.  
7. Retry the execution.  
8. Verify the final result.

**Expected:** Retry creates a new attempt, execution recovers, and all attempts are recorded.

## **E2E-06: Workflow Version Isolation**

1. Publish workflow version 1\.  
2. Submit a request using version 1\.  
3. Create and publish version 2 with changed thresholds.  
4. Complete or inspect the original execution.  
5. Submit a new request.

**Expected:** Original execution uses version 1; new execution uses version 2\.

# **8\. Non-Functional Testing**

## **8.1 Performance Testing**

Basic performance checks:

* API response time under normal local load.  
* Dashboard query response time.  
* Rule evaluation time for a typical workflow.  
* Request submission under concurrent traffic.

For the hackathon, use a small controlled test rather than claiming production-scale performance.

## **8.2 Security Testing**

* Passwords are hashed.  
* JWT authentication is enforced.  
* Role permissions are checked server-side.  
* Input validation is applied.  
* SQL injection is prevented through parameterized ORM queries.  
* Sensitive information is not exposed in logs.  
* Audit records cannot be modified through ordinary application APIs.  
* Secrets are stored in environment variables.

## **8.3 Reliability Testing**

* Database connection failure.  
* Dependency timeout.  
* Partial execution failure.  
* Duplicate concurrent submissions.  
* Retry limit enforcement.  
* Transaction rollback on database errors.

# **9\. Test Data**

Use deterministic sample applications.

| Applicant | Credit Score | Monthly Income | Requested Amount | Expected Outcome |
| ----- | ----- | ----- | ----- | ----- |
| Applicant A | 780 | 100000 | 500000 | Approved |
| Applicant B | 650 | 70000 | 300000 | Manual Review |
| Applicant C | 520 | 50000 | 200000 | Rejected |
| Applicant D | Missing | 60000 | 250000 | Validation Failure |

These values are sample test data. Actual outcomes must follow the published workflow configuration.

# **10\. Test Execution and Automation**

## **10.1 Suggested Commands**

Adapt these commands to the scripts defined in `package.json`.

```
# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run backend development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Run seed data
npx prisma db seed
```

If frontend and backend are separate packages, execute the relevant test commands from their respective directories.

## **10.2 Test Organization**

Suggested backend structure:

```
backend/
└── src/
    └── tests/
        ├── unit/
        │   ├── ruleEvaluator.test.ts
        │   ├── stateMachine.test.ts
        │   └── idempotency.test.ts
        ├── integration/
        │   ├── auth.test.ts
        │   ├── workflows.test.ts
        │   ├── requests.test.ts
        │   ├── executions.test.ts
        │   ├── retries.test.ts
        │   └── reviews.test.ts
        └── e2e/
            ├── approvalFlow.test.ts
            ├── rejectionFlow.test.ts
            └── retryFlow.test.ts
```

Frontend tests should be located alongside components or in a dedicated `tests` directory.

# **11\. Entry and Exit Criteria**

## **11.1 Entry Criteria**

Testing can begin when:

* Required modules are implemented.  
* Database migrations are available.  
* Test environment is configured.  
* Test data is prepared.  
* API contracts are sufficiently stable.

## **11.2 Exit Criteria**

The implementation is considered ready for submission when:

* All critical test cases pass.  
* No known critical or high-severity defects remain.  
* Core happy paths work.  
* Duplicate request prevention works.  
* Failure and retry flows work.  
* Manual review works.  
* Workflow version isolation works.  
* Audit logs and decision explanations are available.  
* README setup instructions are verified.  
* The application runs using the documented setup.

# **12\. Defect Severity**

| Severity | Description | Example |
| ----- | ----- | ----- |
| Critical | Core system unusable or data integrity compromised | Duplicate executions caused by concurrency |
| High | Major requirement broken | Retry mechanism does not work |
| Medium | Functionality partially broken | Incorrect dashboard count |
| Low | Minor usability or display issue | Misaligned UI element |

# **13\. Requirement-to-Test Traceability**

| Requirement | Relevant Test Cases |
| ----- | ----- |
| Structured request intake | REQ-01 to REQ-08 |
| Configurable workflows | WF-01 to WF-08 |
| Rule evaluation | RULE-01 to RULE-14 |
| Execution lifecycle | EXE-01 to EXE-07 |
| Idempotency | IDEM-01 to IDEM-06 |
| Dependency failure | RET-01 to RET-08 |
| Manual review | REV-01 to REV-07 |
| Audit history | AUD-01 to AUD-08 |
| Decision explainability | AUD-07 |
| State management | STATE-01 to STATE-08 |
| Authentication and authorization | AUTH-01 to AUTH-08 |
| Dashboard | DASH-01 to DASH-05 |

# **14\. Final Acceptance Checklist**

* Application starts successfully.  
* Database migrations run successfully.  
* Admin can create and publish a workflow.  
* Operator can submit a valid request.  
* Invalid requests are rejected.  
* Rules execute according to configuration.  
* Approved and rejected outcomes work.  
* Manual review works.  
* Duplicate requests are prevented.  
* Dependency failure is simulated.  
* Retry mechanism works.  
* Retry limits are enforced.  
* Workflow version isolation works.  
* State transitions are validated.  
* Audit history is available.  
* Decision explanations are available.  
* Role-based access control works.  
* Dashboard displays correct information.  
* Automated tests pass.  
* README contains working setup instructions.

# **15\. Instructions for Antigravity**

Use this document as the testing baseline while implementing FlowGuard.

1. Implement unit tests alongside the rule evaluator, state machine, and idempotency logic.  
2. Implement integration tests alongside each API module.  
3. Use a dedicated PostgreSQL test database.  
4. Test database uniqueness and transaction behavior, including concurrent duplicate submissions.  
5. Implement deterministic dependency simulation for success, failure, and timeout.  
6. Verify retry limits and attempt history.  
7. Verify audit events for every important state change and business decision.  
8. Add regression tests when fixing defects.  
9. Run the full test suite before declaring implementation complete.  
10. Do not claim a test passed unless it was actually executed and its result verified.

**Priority:** Correctness, data consistency, idempotency, failure recovery, and explainability take precedence over cosmetic UI testing.

---

**End of Test Plan**

