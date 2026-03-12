SmartSplit – API Contract (v1)

Base URL:
/api/v1

Authentication:
All protected routes require valid Clerk JWT in Authorization: Bearer <token>
Backend maps clerkUserId → internal userId

1️⃣ Groups Context
Endpoint List
Method	Path	Description
POST	/groups	Create a new group
GET	/groups	List groups for current user
GET	/groups/:groupId	Get group details
POST	/groups/:groupId/members	Add member to group
PATCH	/groups/:groupId/members/:memberId/preferences	Update member preferences
DELETE	/groups/:groupId/members/:memberId	Remove member

Key Contract: Create Group
POST /api/v1/groups
Request
{
  "name": "Goa Trip",
  "description": "Weekend trip expenses"
}
Fields:
name (string, required, max 100 chars)
description (string, optional, max 300 chars)
Response (201)
{
  "id": "grp_12345",
  "name": "Goa Trip",
  "description": "Weekend trip expenses",
  "createdBy": "usr_001",
  "createdAt": "2026-03-05T12:30:00Z",
  "memberCount": 1,
  "currency": "INR"
}

Key Contract: Add Member
POST /api/v1/groups/:groupId/members
Request
{
  "userId": "usr_002",
  "preferences": {
    "isVegetarian": true,
    "drinksAlcohol": false
  }
}
Fields:
userId (string, required)
preferences (object, required)
isVegetarian (boolean, required)
drinksAlcohol (boolean, required)
Response (201)
{
  "memberId": "mem_789",
  "userId": "usr_002",
  "groupId": "grp_12345",
  "preferences": {
    "isVegetarian": true,
    "drinksAlcohol": false
  }
}

2️⃣ Expenses Context
Endpoint List
Method	Path	Description
POST	/groups/:groupId/expenses	Create itemized expense
GET	/groups/:groupId/expenses	List group expenses
GET	/expenses/:expenseId	Get expense details
PATCH	/expenses/:expenseId	Update expense (partial)
PUT	/expenses/:expenseId	Replace expense (full)
DELETE	/expenses/:expenseId	Delete expense

Key Contract: Create Itemized Expense
POST /api/v1/groups/:groupId/expenses
Request
{
  "title": "Dinner at Thalassa",
  "paidBy": "usr_001",
  "currency": "INR",
  "items": [
    {
      "name": "Paneer Butter Masala",
      "amount": 280,
      "category": "veg",
      "sharedBy": ["usr_001", "usr_002"]
    },
    {
      "name": "Chicken Biryani",
      "amount": 320,
      "category": "non_veg",
      "sharedBy": ["usr_003"]
    },
    {
      "name": "Kingfisher Beer",
      "amount": 200,
      "category": "alcohol",
      "sharedBy": ["usr_001"]
    }
  ],
  "taxAmount": 80
}
Fields:
title (string, required)
paidBy (string, required, must be group member)
currency (string, required, must match group currency)
items (array, required, min 1)
name (string, required)
amount (number, required, > 0)
category (enum: veg | non_veg | alcohol | shared)
sharedBy (array of userId, required)
taxAmount (number, optional, default 0)
Response (201)
{
  "expenseId": "exp_456",
  "groupId": "grp_12345",
  "totalAmount": 880,
  "splitSummary": [
    {
      "userId": "usr_001",
      "owes": 0,
      "paid": 880,
      "netBalance": 520
    },
    {
      "userId": "usr_002",
      "owes": 180,
      "paid": 0,
      "netBalance": -180
    },
    {
      "userId": "usr_003",
      "owes": 180,
      "paid": 0,
      "netBalance": -180
    }
  ]
}

Note: PATCH for partial update, PUT for full replacement. All expense changes trigger settlement recalculation.

3️⃣ Settlement Context
Endpoint List
Method	Path	Description
GET	/groups/:groupId/settlements	Get settlement summary
POST	/groups/:groupId/settlements/recalculate	Recompute balances

Key Contract: Settlement Summary
GET /api/v1/groups/:groupId/settlements
Response (200)
{
  "groupId": "grp_12345",
  "netBalances": [
    { "userId": "usr_001", "balance": 520 },
    { "userId": "usr_002", "balance": -260 },
    { "userId": "usr_003", "balance": -260 }
  ],
  "optimizedTransactions": [
    {
      "fromUserId": "usr_002",
      "toUserId": "usr_001",
      "amount": 260,
      "timestamp": "2026-03-05T15:00:00Z"
    },
    {
      "fromUserId": "usr_003",
      "toUserId": "usr_001",
      "amount": 260,
      "timestamp": "2026-03-05T15:00:00Z"
    }
  ]
}

Settlement records log who paid whom, with timestamp. All settlement plans are recalculated after expense changes.

4️⃣ AI Ingestion Context
Endpoint List
Method	Path	Description
POST	/groups/:groupId/bills	Upload bill
GET	/bills/:billId	Get bill processing status
POST	/bills/:billId/confirm	Confirm parsed items

Key Contract: Upload Bill
POST /api/v1/groups/:groupId/bills
Request:
Multipart form-data
file (required, image/jpeg, image/png, application/pdf)
Response (202 Accepted)
{
  "billId": "bill_999",
  "status": "PROCESSING",
  "uploadedAt": "2026-03-05T14:10:00Z"
}

Key Contract: Get Bill Status
GET /api/v1/bills/:billId
{
  "billId": "bill_999",
  "status": "COMPLETED",
  "parsedItems": [
    {
      "name": "Paneer Butter Masala",
      "amount": 280,
      "category": "veg"
    },
    {
      "name": "Chicken Biryani",
      "amount": 320,
      "category": "non_veg"
    }
  ],
  "totalDetectedAmount": 600
}

5️⃣ Identity Mapping Endpoint (Optional)
Because Clerk handles auth, you may need:
Method	Path	Description
POST	/users/sync	Sync Clerk user to internal profile
Response:
{
  "userId": "usr_001",
  "clerkUserId": "user_2abcXYZ",
  "created": true
}

6️⃣ Error Model (Global)
All errors follow this structure:
{
  "error": {
    "code": "GROUP_NOT_FOUND",
    "message": "Group does not exist",
    "details": null,
    "requestId": "req_123abc"
  }
}
Fields:
code (string, machine-readable)
message (string, human-readable)
details (optional object)
requestId (string, for tracing)

All endpoints validate input and return 400 with error details if invalid.

7️⃣ Versioning Strategy
All endpoints prefixed with:
/api/v1/
Future changes:
Non-breaking changes → same version
Breaking changes → /api/v2/
## Next Steps (Prioritized)

1. Implement Expenses Context
  - Controllers: `createExpense`, `listExpenses`, `getExpenseDetails`, `updateExpense`, `replaceExpense`, `deleteExpense`.
  - Routes: `POST /groups/:groupId/expenses`, `GET /groups/:groupId/expenses`, `GET /expenses/:expenseId`, `PATCH /expenses/:expenseId`, `PUT /expenses/:expenseId`, `DELETE /expenses/:expenseId`.
  - Validate `paidBy` is a group member, `currency` matches group, compute `splitSummary`.

2. Implement Settlement Context
  - Controllers: `getSettlementSummary`, `recalculateSettlements`.
  - Routes: `GET /groups/:groupId/settlements`, `POST /groups/:groupId/settlements/recalculate`.
  - Compute `netBalances` and `optimizedTransactions`, persist settlement logs.

3. Implement Bills (AI ingestion)
  - Controllers: `uploadBill`, `getBillStatus`, `confirmBillItems`.
  - Routes: `POST /groups/:groupId/bills`, `GET /bills/:billId`, `POST /bills/:billId/confirm`.
  - Handle multipart uploads, background parsing, and status tracking.

4. Integrate Authentication (Clerk)
  - Add JWT middleware to validate Clerk tokens and map `clerkUserId` → internal `userId`.
  - Protect all mutating endpoints; update controllers to use authenticated `userId`.

5. Standardize Error Handling
  - Implement `AppError` and centralized error-handling middleware to return the global error model.

6. Tests (Unit & Integration)
  - Add Jest + Supertest tests for Groups, Expenses, Settlements, and Bills.

7. Wire Routes & Index
  - Create route files and import/mount them in `src/index.ts` under `/api/v1`.

8. Prisma & Env
  - Extend Prisma schema for expenses, settlements, bills; ensure `.env` has `DATABASE_URL` and run `npx prisma generate`.

9. Docs & README
  - Update README with run/test/deploy steps and add API examples.

10. Deployment & CI
  - Add Dockerfile, CI workflow for tests, and deployment config.

---

These items were added to the project TODO tracker.
