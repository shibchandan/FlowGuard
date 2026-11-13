# **FlowGuard – API Specification**

**Project: FlowGuard – Configurable Workflow Decision Platform**  
**Document: API Specification**  
**Version: 1.0**  
**Base URL: `/api/v1`**  
**Protocol: REST over HTTPS**  
**Data Format: JSON**  
**Authentication: JWT Bearer Token**  
**Backend: Node.js \+ Express \+ TypeScript**  
**Database: PostgreSQL \+ Prisma**

---

# **1\. Introduction**

## **1.1 Purpose**

**This document defines the REST API contract for FlowGuard.**

**It specifies:**

* **API endpoints and HTTP methods.**  
* **Request parameters and request bodies.**  
* **Response structures.**  
* **Authentication and authorization.**  
* **Validation rules.**  
* **HTTP status codes.**  
* **Error handling.**  
* **Pagination and filtering.**  
* **Idempotency behavior.**  
* **Workflow execution and retry operations.**

## **1.2 API Conventions**

**All endpoints are prefixed with:**

**`/api/v1`**

**Content type:**

**`application/json`**

**Authentication header:**

**`Authorization: Bearer <JWT_TOKEN>`**

**Idempotency header for request submission:**

**`Idempotency-Key: <UNIQUE_KEY>`**

**Dates and timestamps use ISO 8601 UTC format.**

**UUIDs are used for resource identifiers.**

## **1.3 Standard Success Response**

```
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

## **1.4 Standard Error Response**

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

# **2\. Authentication and Authorization**

## **2.1 Login**

**Endpoint: `POST /api/v1/auth/login`**

**Access: Public**

### **Request**

```
{
  "email": "admin@flowguard.local",
  "password": "your-password"
}
```

### **Success Response – 200**

```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "uuid",
      "name": "Admin",
      "email": "admin@flowguard.local",
      "role": "ADMIN"
    }
  }
}
```

### **Error Responses**

* **400 – Invalid input.**  
* **401 – Invalid credentials.**  
* **403 – User account disabled.**

## **2.2 Get Current User**

**Endpoint: `GET /api/v1/auth/me`**

**Access: Authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@flowguard.local",
    "role": "ADMIN"
  }
}
```

---

# **3\. Dashboard APIs**

## **3.1 Get Dashboard Summary**

**Endpoint: `GET /api/v1/dashboard/summary`**

**Access: ADMIN, OPERATOR, REVIEWER, VIEWER**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "totalRequests": 120,
    "approvedRequests": 70,
    "rejectedRequests": 20,
    "pendingReviews": 15,
    "failedExecutions": 5,
    "retryingRequests": 10
  }
}
```

## **3.2 Get Recent Activity**

**Endpoint: `GET /api/v1/dashboard/activity`**

**Access: All authenticated users.**

### **Query Parameters**

| Parameter | Type | Description |
| ----- | ----- | ----- |
| **limit** | **Number** | **Number of records, default 10** |
| **page** | **Number** | **Page number, default 1** |

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "REQUEST_SUBMITTED",
      "entityType": "REQUEST",
      "entityId": "uuid",
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

# **4\. Workflow APIs**

## **4.1 List Workflows**

**Endpoint: `GET /api/v1/workflows`**

**Access: All authenticated users.**

### **Query Parameters**

| Parameter | Type | Description |
| ----- | ----- | ----- |
| **page** | **Number** | **Page number** |
| **limit** | **Number** | **Records per page** |
| **search** | **String** | **Search workflow name** |
| **isActive** | **Boolean** | **Filter active workflows** |

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "workflow-uuid",
      "name": "Loan Application Approval",
      "description": "Loan application decision workflow",
      "isActive": true,
      "latestVersion": 1,
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## **4.2 Create Workflow**

**Endpoint: `POST /api/v1/workflows`**

**Access: ADMIN**

### **Request**

```
{
  "name": "Loan Application Approval",
  "description": "Automated loan application processing"
}
```

### **Response – 201**

```
{
  "success": true,
  "message": "Workflow created successfully",
  "data": {
    "id": "workflow-uuid",
    "name": "Loan Application Approval",
    "isActive": true
  }
}
```

## **4.3 Get Workflow Details**

**Endpoint: `GET /api/v1/workflows/:id`**

**Access: All authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "id": "workflow-uuid",
    "name": "Loan Application Approval",
    "description": "Loan processing workflow",
    "isActive": true,
    "latestVersion": 1
  }
}
```

## **4.4 Get Workflow Versions**

**Endpoint: `GET /api/v1/workflows/:id/versions`**

**Access: All authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "version-uuid",
      "version": 1,
      "status": "PUBLISHED",
      "publishedAt": "2026-11-13T10:00:00.000Z"
    }
  ]
}
```

## **4.5 Create Workflow Draft Version**

**Endpoint: `POST /api/v1/workflows/:id/versions`**

**Access: ADMIN**

### **Request**

```
{
  "configuration": {
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
        "name": "Credit Score",
        "field": "creditScore",
        "operator": "GTE",
        "value": 750,
        "priority": 2,
        "failureAction": "MANUAL_REVIEW",
        "isActive": true
      }
    ],
    "execution": {
      "maxRetries": 3
    }
  }
}
```

### **Response – 201**

```
{
  "success": true,
  "message": "Draft version created",
  "data": {
    "id": "version-uuid",
    "workflowId": "workflow-uuid",
    "version": 2,
    "status": "DRAFT"
  }
}
```

## **4.6 Publish Workflow Version**

**Endpoint: `POST /api/v1/workflows/:id/versions/:versionId/publish`**

**Access: ADMIN**

### **Response – 200**

```
{
  "success": true,
  "message": "Workflow version published",
  "data": {
    "id": "version-uuid",
    "version": 2,
    "status": "PUBLISHED",
    "publishedAt": "2026-11-13T10:00:00.000Z"
  }
}
```

### **Business Rules**

* **Only draft versions can be published.**  
* **Configuration must pass validation.**  
* **A workflow must have at most one active published version for new requests.**  
* **Publishing must not modify existing executions.**  
* **Published configurations must be immutable.**

---

# **5\. Request APIs**

## **5.1 Submit Request**

**Endpoint: `POST /api/v1/requests`**

**Access: ADMIN, OPERATOR**

### **Headers**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Idempotency-Key: loan-app-unique-001
```

### **Request**

```
{
  "workflowId": "workflow-uuid",
  "data": {
    "applicantName": "Rahul Sharma",
    "email": "rahul@example.com",
    "age": 25,
    "creditScore": 780,
    "monthlyIncome": 45000,
    "requestedAmount": 300000
  }
}
```

### **Success Response – 202**

```
{
  "success": true,
  "message": "Request accepted for processing",
  "data": {
    "requestId": "request-uuid",
    "referenceNumber": "FG-2026-000001",
    "status": "RECEIVED",
    "executionId": "execution-uuid"
  }
}
```

### **Duplicate Response – 200**

**If the same idempotency key and same payload are submitted again, return the existing request.**

```
{
  "success": true,
  "message": "Existing request returned",
  "data": {
    "requestId": "request-uuid",
    "referenceNumber": "FG-2026-000001",
    "status": "PROCESSING",
    "executionId": "execution-uuid"
  }
}
```

### **Error Responses**

| HTTP Status | Condition |
| ----- | ----- |
| **400** | **Invalid payload** |
| **401** | **Unauthorized** |
| **403** | **Insufficient permission** |
| **404** | **Workflow not found** |
| **409** | **Idempotency key reused with different payload** |
| **422** | **Workflow configuration or input validation failure** |

## **5.2 List Requests**

**Endpoint: `GET /api/v1/requests`**

**Access: All authenticated users.**

### **Query Parameters**

| Parameter | Type | Description |
| ----- | ----- | ----- |
| **page** | **Number** | **Default 1** |
| **limit** | **Number** | **Default 10, maximum 100** |
| **status** | **String** | **Filter by status** |
| **workflowId** | **UUID** | **Filter by workflow** |
| **search** | **String** | **Search reference number** |
| **fromDate** | **Date** | **Start date** |
| **toDate** | **Date** | **End date** |

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "request-uuid",
      "referenceNumber": "FG-2026-000001",
      "workflowName": "Loan Application Approval",
      "status": "APPROVED",
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## **5.3 Get Request Details**

**Endpoint: `GET /api/v1/requests/:id`**

**Access: All authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "referenceNumber": "FG-2026-000001",
    "workflowId": "workflow-uuid",
    "status": "APPROVED",
    "inputData": {
      "applicantName": "Rahul Sharma",
      "age": 25,
      "creditScore": 780
    },
    "createdAt": "2026-11-13T10:00:00.000Z",
    "updatedAt": "2026-11-13T10:01:00.000Z"
  }
}
```

## **5.4 Get Request History**

**Endpoint: `GET /api/v1/requests/:id/history`**

**Access: All authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "fromStatus": "RECEIVED",
      "toStatus": "VALIDATED",
      "reason": "Input validation successful",
      "createdAt": "2026-11-13T10:00:10.000Z"
    },
    {
      "fromStatus": "VALIDATED",
      "toStatus": "PROCESSING",
      "reason": "Execution started",
      "createdAt": "2026-11-13T10:00:15.000Z"
    }
  ]
}
```

---

# **6\. Execution APIs**

## **6.1 Get Execution Details**

**Endpoint: `GET /api/v1/executions/:id`**

**Access: All authenticated users.**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "id": "execution-uuid",
    "requestId": "request-uuid",
    "workflowVersionId": "version-uuid",
    "status": "APPROVED",
    "currentStage": "COMPLETED",
    "decision": "APPROVED",
    "decisionReason": "All configured rules passed",
    "ruleTrace": [
      {
        "ruleId": "RULE_001",
        "ruleName": "Minimum Age",
        "passed": true,
        "message": "Minimum age requirement satisfied"
      }
    ],
    "startedAt": "2026-11-13T10:00:00.000Z",
    "completedAt": "2026-11-13T10:00:02.000Z"
  }
}
```

## **6.2 Retry Execution**

**Endpoint: `POST /api/v1/executions/:id/retry`**

**Access: ADMIN, OPERATOR**

### **Request**

```
{
  "reason": "Retry after temporary dependency failure"
}
```

### **Response – 202**

```
{
  "success": true,
  "message": "Retry accepted",
  "data": {
    "executionId": "execution-uuid",
    "status": "RETRY",
    "attemptNumber": 2
  }
}
```

### **Error Responses**

* **403 – Insufficient permission.**  
* **404 – Execution not found.**  
* **409 – Execution is not retryable.**  
* **409 – Maximum retries exceeded.**

**Only retry transient dependency failures. Do not retry business-rule rejection or invalid input.**

---

# **7\. Manual Review APIs**

## **7.1 List Reviews**

**Endpoint: `GET /api/v1/reviews`**

**Access: ADMIN, REVIEWER**

### **Query Parameters**

| Parameter | Type | Description |
| ----- | ----- | ----- |
| **page** | **Number** | **Default 1** |
| **limit** | **Number** | **Default 10** |
| **status** | **String** | **PENDING, APPROVED, REJECTED** |
| **assignedToMe** | **Boolean** | **Show current reviewer's tasks** |

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "requestId": "request-uuid",
      "referenceNumber": "FG-2026-000002",
      "reviewStatus": "PENDING",
      "assignedTo": null,
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ]
}
```

## **7.2 Get Review Details**

**Endpoint: `GET /api/v1/reviews/:id`**

**Access: ADMIN, REVIEWER**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "requestId": "request-uuid",
    "reviewStatus": "PENDING",
    "request": {
      "referenceNumber": "FG-2026-000002",
      "inputData": {
        "applicantName": "Rahul Sharma",
        "creditScore": 650
      }
    },
    "decisionExplanation": {
      "summary": "Credit score requires manual verification"
    }
  }
}
```

## **7.3 Submit Review Decision**

**Endpoint: `POST /api/v1/reviews/:id/decision`**

**Access: ADMIN, REVIEWER**

### **Request**

```
{
  "decision": "APPROVED",
  "comment": "Supporting information verified successfully"
}
```

**Allowed decisions:**

* **APPROVED**  
* **REJECTED**

### **Response – 200**

```
{
  "success": true,
  "message": "Review decision recorded",
  "data": {
    "reviewId": "review-uuid",
    "reviewStatus": "APPROVED",
    "requestStatus": "COMPLETED",
    "reviewedAt": "2026-11-13T10:30:00.000Z"
  }
}
```

### **Business Rules**

* **Only pending reviews can be decided.**  
* **The reviewer must be authorized.**  
* **A review cannot be completed twice.**  
* **Decision, review record, request transition, and audit event must be saved atomically.**  
* **Preserve the reviewer decision separately from the final request lifecycle status.**

---

# **8\. Audit APIs**

## **8.1 List Audit Logs**

**Endpoint: `GET /api/v1/audit`**

**Access: ADMIN, VIEWER**

### **Query Parameters**

| Parameter | Type | Description |
| ----- | ----- | ----- |
| **page** | **Number** | **Default 1** |
| **limit** | **Number** | **Default 20** |
| **entityType** | **String** | **REQUEST, EXECUTION, WORKFLOW** |
| **entityId** | **UUID** | **Filter by entity** |
| **action** | **String** | **Filter by action** |
| **fromDate** | **Date** | **Start date** |
| **toDate** | **Date** | **End date** |

### **Response – 200**

```
{
  "success": true,
  "data": [
    {
      "id": "audit-uuid",
      "entityType": "REQUEST",
      "entityId": "request-uuid",
      "action": "REQUEST_SUBMITTED",
      "actorId": "user-uuid",
      "metadata": {
        "status": "RECEIVED"
      },
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Audit endpoints are read-only.**

---

# **9\. Dependency Simulation APIs**

**These endpoints exist to make dependency failures reproducible during demonstration and testing.**

## **9.1 Get Simulator Configuration**

**Endpoint: `GET /api/v1/admin/simulator`**

**Access: ADMIN**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "mode": "SUCCESS"
  }
}
```

## **9.2 Update Simulator Mode**

**Endpoint: `PUT /api/v1/admin/simulator`**

**Access: ADMIN**

### **Request**

```
{
  "mode": "TEMPORARY_FAILURE"
}
```

**Allowed modes:**

* **SUCCESS**  
* **TEMPORARY\_FAILURE**  
* **PERMANENT\_FAILURE**

### **Response – 200**

```
{
  "success": true,
  "message": "Simulator mode updated",
  "data": {
    "mode": "TEMPORARY_FAILURE"
  }
}
```

**The simulator is a development/demo facility, not a production dependency-management API. Its configuration should be isolated from real integrations.**

---

# **10\. Health Check API**

## **10.1 Health Check**

**Endpoint: `GET /api/v1/health`**

**Access: Public or internal monitoring.**

### **Response – 200**

```
{
  "success": true,
  "data": {
    "status": "UP",
    "database": "CONNECTED",
    "timestamp": "2026-11-13T10:00:00.000Z"
  }
}
```

**Do not expose secrets, internal stack traces, or sensitive infrastructure information.**

---

# **11\. Pagination Standard**

**List endpoints should support:**

* **`page`: default 1\.**  
* **`limit`: default 10\.**  
* **Maximum limit: 100\.**

**Example:**

**`GET /api/v1/requests?page=1&limit=10&status=APPROVED`**

**Response pagination:**

```
{
  "page": 1,
  "limit": 10,
  "total": 50,
  "totalPages": 5
}
```

**Use deterministic sorting, preferably by `createdAt DESC` and then `id DESC`.**

---

# **12\. API Validation Rules**

## **12.1 Request Validation**

* **`workflowId` must be a valid UUID.**  
* **`data` must be a JSON object.**  
* **Required fields must be present.**  
* **Fields must match the selected workflow schema.**  
* **Additional fields must follow the workflow's configured policy.**  
* **Numeric values must be within configured constraints.**

## **12.2 Workflow Validation**

* **Workflow name is required.**  
* **Rule ID must be unique within the workflow version.**  
* **Rule priority must be valid.**  
* **Operator must be supported.**  
* **Comparison value must match operator requirements.**  
* **Failure action must be supported.**  
* **Rule field must exist in the configured input schema.**

## **12.3 Review Validation**

* **Decision must be APPROVED or REJECTED.**  
* **Comment length must be within configured limits.**  
* **Only pending reviews may be decided.**

---

# **13\. HTTP Status Code Reference**

| Code | Meaning |
| ----- | ----- |
| **200** | **Successful operation** |
| **201** | **Resource created** |
| **202** | **Request accepted for asynchronous processing** |
| **400** | **Bad request** |
| **401** | **Unauthorized** |
| **403** | **Forbidden** |
| **404** | **Resource not found** |
| **409** | **Conflict** |
| **422** | **Business or configuration validation failure** |
| **429** | **Rate limit exceeded** |
| **500** | **Internal server error** |
| **503** | **Temporary dependency unavailable** |

---

# **14\. Authorization Matrix**

| API Group | ADMIN | OPERATOR | REVIEWER | VIEWER |
| ----- | ----- | ----- | ----- | ----- |
| **Authentication** | **Yes** | **Yes** | **Yes** | **Yes** |
| **Dashboard** | **Yes** | **Yes** | **Yes** | **Yes** |
| **List Workflows** | **Yes** | **Yes** | **Yes** | **Yes** |
| **Create/Publish Workflow** | **Yes** | **No** | **No** | **No** |
| **Submit Request** | **Yes** | **Yes** | **No** | **No** |
| **View Requests** | **Yes** | **Yes** | **Yes** | **Yes** |
| **Retry Execution** | **Yes** | **Yes** | **No** | **No** |
| **Manual Reviews** | **Yes** | **No** | **Yes** | **No** |
| **Audit Logs** | **Yes** | **No** | **No** | **Yes** |
| **Simulator Configuration** | **Yes** | **No** | **No** | **No** |

**The backend must enforce these permissions on every protected endpoint.**

---

# **15\. API Implementation Structure**

**Recommended Express route structure:**

```
src/
├── modules/
│   ├── auth/
│   │   └── auth.routes.ts
│   ├── dashboard/
│   │   └── dashboard.routes.ts
│   ├── workflows/
│   │   └── workflow.routes.ts
│   ├── requests/
│   │   └── request.routes.ts
│   ├── executions/
│   │   └── execution.routes.ts
│   ├── reviews/
│   │   └── review.routes.ts
│   ├── audit/
│   │   └── audit.routes.ts
│   └── integrations/
│       └── simulator.routes.ts
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   ├── validate.middleware.ts
│   └── error.middleware.ts
│
└── app.ts
```

**Use a shared response helper and centralized error middleware to maintain consistent response formats.**

---

# **16\. API Testing Requirements**

**Use Vitest and Supertest.**

**Required API tests:**

| Test ID | API Scenario | Expected |
| ----- | ----- | ----- |
| **API-01** | **Login with valid credentials** | **200** |
| **API-02** | **Login with invalid credentials** | **401** |
| **API-03** | **Create workflow as admin** | **201** |
| **API-04** | **Create workflow as operator** | **403** |
| **API-05** | **Publish valid workflow** | **200** |
| **API-06** | **Submit valid request** | **202** |
| **API-07** | **Submit invalid request** | **400 or 422** |
| **API-08** | **Submit duplicate idempotency key** | **Existing request** |
| **API-09** | **Reuse key with different payload** | **409** |
| **API-10** | **Get request details** | **200** |
| **API-11** | **Retry eligible execution** | **202** |
| **API-12** | **Retry non-retryable execution** | **409** |
| **API-13** | **Submit manual review decision** | **200** |
| **API-14** | **Access unauthorized endpoint** | **403** |
| **API-15** | **Retrieve audit logs** | **200** |
| **API-16** | **Change simulator mode as admin** | **200** |

---

# **17\. OpenAPI Documentation**

**Antigravity should generate an OpenAPI 3.x specification based on this API contract.**

**Recommended implementation:**

* **`swagger-jsdoc`**  
* **`swagger-ui-express`**

**Expose interactive documentation at:**

**`/api/docs`**

**The OpenAPI document should include:**

* **All endpoints.**  
* **Authentication scheme.**  
* **Request schemas.**  
* **Response schemas.**  
* **Error responses.**  
* **Query parameters.**  
* **Authorization requirements.**

**The generated OpenAPI document must match the actual Express routes and Zod validation schemas.**

---

# **18\. Instructions for Antigravity**

1. **Read PRD, TRD, SRS, HLD, LLD, and DATABASE\_DESIGN.md.**  
2. **Use this document as the API contract.**  
3. **Implement routes, controllers, services, and validation schemas.**  
4. **Use Zod for request validation.**  
5. **Use JWT middleware for authentication.**  
6. **Use role middleware for authorization.**  
7. **Maintain consistent response structures.**  
8. **Implement pagination on list endpoints.**  
9. **Implement idempotency for request submission.**  
10. **Implement workflow versioning.**  
11. **Implement execution and retry endpoints.**  
12. **Implement manual review endpoints.**  
13. **Implement audit retrieval.**  
14. **Add automated API tests.**  
15. **Generate OpenAPI documentation.**  
16. **Do not expose database internals in API responses.**  
17. **Do not claim an API is complete until its integration tests pass.**

**Final objective: Deliver a consistent, secure, testable REST API that supports the complete FlowGuard workflow lifecycle.**

---

**End of API Specification v1.0**

