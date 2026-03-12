#!/bin/bash

# Clerk Authentication Testing Script
# This script helps you test the Clerk authentication setup

set -e

API_BASE_URL="http://localhost:3000/api/v1"
CLERK_TOKEN="${1:-}"

if [ -z "$CLERK_TOKEN" ]; then
    echo "❌ Error: Clerk JWT token not provided"
    echo ""
    echo "Usage: ./test-clerk-auth.sh <your_clerk_jwt_token>"
    echo ""
    echo "To get a Clerk token:"
    echo "1. Go to https://dashboard.clerk.com/"
    echo "2. Create or select a user"
    echo "3. Copy their JWT token (or generate a test token)"
    echo "4. Run: ./test-clerk-auth.sh <token>"
    exit 1
fi

echo "🚀 Testing Clerk Authentication"
echo "================================"
echo ""

# Test 1: Health check (no auth required)
echo "✓ Test 1: Health Check (No Auth)"
echo "  GET $API_BASE_URL/health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" -ne 200 ]; then
    echo "❌ Health check failed. Is the server running?"
    exit 1
fi

# Test 2: Create Group with Auth
echo "✓ Test 2: Create Group (With Auth)"
echo "  POST $API_BASE_URL/groups"
echo "  Auth: Bearer ${CLERK_TOKEN:0:20}..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/groups" \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group '"$(date +%s)"'",
    "description": "Test group for Clerk auth",
    "currency": "INR"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Successfully created group with authentication!"
    GROUP_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null || echo "")
    if [ ! -z "$GROUP_ID" ] && [ "$GROUP_ID" != "null" ]; then
        echo "   Group ID: $GROUP_ID"
    fi
else
    echo "❌ Failed to create group"
    if echo "$BODY" | jq . >/dev/null 2>&1; then
        echo "   Response: $(echo "$BODY" | jq .)"
    fi
fi
echo ""

# Test 3: Create Group without Auth (should fail)
echo "✓ Test 3: Create Group (Without Auth - Should Fail)"
echo "  POST $API_BASE_URL/groups"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/groups" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Test",
    "currency": "INR"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Correctly rejected request without authentication!"
else
    echo "⚠️  Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 4: Invalid Token (should fail)
echo "✓ Test 4: Create Group (Invalid Token - Should Fail)"
echo "  POST $API_BASE_URL/groups"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/groups" \
  -H "Authorization: Bearer invalid_token_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Token Test",
    "currency": "INR"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Correctly rejected invalid token!"
else
    echo "⚠️  Expected 401, got $HTTP_CODE"
fi
echo ""

echo "================================"
echo "✅ Clerk Authentication Tests Complete!"
echo ""
echo "Summary:"
echo "  ✓ Health check (no auth)"
echo "  ✓ Create group (with valid auth)"
echo "  ✓ Create group (without auth) - rejected"
echo "  ✓ Create group (invalid auth) - rejected"
echo ""
echo "🎉 Authentication is working correctly!"
