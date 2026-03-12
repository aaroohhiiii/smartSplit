# Clerk Authentication Setup Guide

## ✅ Setup Complete

Clerk authentication has been successfully integrated into the SmartSplit API. Here's what was configured:


### 2. **Authentication Middleware** ✅
Created `/src/middleware/auth.ts` with:
- `verifyClerkToken()` - Verifies tokens via Clerk API
- `verifyClerkTokenLocal()` - Decodes tokens locally (current implementation)
- `requireAuth()` - Ensures user is authenticated

### 3. **Protected Routes** ✅
All API routes now require Clerk JWT tokens:
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups/:groupId/...` - Get group operations
- `POST /api/v1/expenses` - Create expense
- `POST /api/v1/bills/:groupId` - Upload bill
- `GET/POST /api/v1/settlements` - Settlement operations

### 4. **Authenticated User ID**
The authenticated user's Clerk ID is automatically:
- Extracted from the JWT token
- Attached to `req.auth.userId`
- Used as `createdBy` in expenses and groups
- Used as `uploadedBy` in bill uploads

---

## 🧪 Testing the Authentication

### Step 1: Get a Clerk JWT Token
Log in to your Clerk dashboard and create a test user or use Postman's Clerk integration.

Alternatively, use this quick test:
```bash
# Using a test Clerk user token (replace with actual token)
export CLERK_TOKEN="your_clerk_jwt_token_here"
```

### Step 2: Create a Group (Authenticated)
```bash
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Dinner",
    "description": "Office team dinner",
    "currency": "INR"
  }'
```

**Expected Response:**
```json
{
  "id": "group-uuid",
  "name": "Team Dinner",
  "currency": "INR",
  "createdBy": "user_xxxxx",
  "createdAt": "2026-03-08T..."
}
```

### Step 3: Test Without Token (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "currency": "INR"}'
```

**Expected Response:**
```json
{
  "error": "Missing or invalid authorization header"
}
```

### Step 4: Health Check (No Auth Required)
```bash
curl http://localhost:3000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

---

## 📋 How It Works

### Request Flow:
```
Client Request
    ↓
Authorization Header (Bearer {token})
    ↓
Middleware: verifyClerkTokenLocal()
    ↓
Decode JWT and extract user_id
    ↓
Attach to req.auth.userId
    ↓
requireAuth() middleware
    ↓
Controller receives authenticated user
    ↓
Use req.auth.userId as createdBy automatically
```

### Token Format:
```
Header.Payload.Signature
```

The Payload is base64-encoded JSON containing:
```json
{
  "sub": "user_xxxxx",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 🔧 Implementation Details

### Controllers Updated:
- **groupController.ts**: `createdBy` auto-set from `req.auth.userId`
- **expenseController.ts**: `createdBy` auto-set from `req.auth.userId`
- **billController.ts**: `uploadedBy` auto-set from `req.auth.userId`

### Utility Files:
- `/src/middleware/auth.ts` - Authentication logic
- `/src/utils/apiHelper.ts` - Helper functions for auth and responses

### Middleware Order (in index.ts):
```typescript
app.use("/api/v1/groups", verifyClerkTokenLocal, requireAuth, groupRoutes);
```

1. `verifyClerkTokenLocal` - Validates token and extracts user ID
2. `requireAuth` - Ensures user is authenticated
3. Route handler - Uses `req.auth.userId`

---

## 🚀 Next Steps

### Option 1: Use Local Token Decoding (Current)
- No external API calls
- Faster response time
- Good for MVP/testing
- ⚠️ No token revocation check

### Option 2: Use Clerk API Verification (Production)
Replace in `index.ts`:
```typescript
app.use("/api/v1/groups", verifyClerkToken, requireAuth, groupRoutes);
```

This calls Clerk's verification endpoint for added security.

### Option 3: Switch Between Modes
Create an environment variable:
```bash
USE_CLERK_API_VERIFICATION=true
```

And conditionally use the appropriate middleware.

---

## 📱 Frontend Integration

From your React/Next.js app:

```typescript
import { useAuth } from "@clerk/clerk-react";

function MyComponent() {
  const { getToken } = useAuth();

  const createGroup = async (name) => {
    const token = await getToken();
    
    const response = await fetch("/api/v1/groups", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, currency: "INR" }),
    });

    return response.json();
  };

  // ...
}
```

---

## 🐛 Troubleshooting

### "Missing or invalid authorization header"
- Add `Authorization: Bearer {token}` to headers
- Verify token format (starts with `Bearer `)

### "Token verification failed"
- Check token hasn't expired
- Verify `CLERK_SECRET_KEY` is correct
- Token should be from Clerk

### "User not authenticated"
- Ensure `requireAuth` middleware is applied
- Check token contains `sub` or `user_id` claim

---

## ✅ Verification Checklist

- [x] Clerk env variables configured
- [x] Auth middleware created
- [x] Routes protected with authentication
- [x] User ID auto-injected from token
- [x] Controllers updated to use req.auth.userId
- [x] Health endpoint remains public
- [x] TypeScript compilation successful
- [x] Ready for testing with Clerk tokens

Start the server:
```bash
npm run dev
```

Then test with authenticated requests! 🎉
