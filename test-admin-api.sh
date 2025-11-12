#!/bin/bash
# Test Admin Login API

echo "🔍 Testing Viecom Admin Login API"
echo "=================================="
echo ""

echo "📡 Testing API endpoint..."
echo ""

curl -v -X POST https://www.viecom.pro/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@viecom.pro",
    "password": "admin123456",
    "remember": false
  }' 2>&1 | tee /tmp/admin-test.log

echo ""
echo ""
echo "=================================="
echo "✅ Test completed. Check the output above."
echo ""
echo "Expected responses:"
echo "- 200 OK = Login successful"
echo "- 401 Unauthorized = Wrong credentials or admin doesn't exist"
echo "- 500 Server Error = Database or config issue"
echo "- 404 Not Found = API route not deployed"
echo ""

