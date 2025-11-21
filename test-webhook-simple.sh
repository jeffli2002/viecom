#\!/bin/bash

# Simple webhook test - check if it reaches the server

echo "Testing webhook endpoint..."
echo ""

curl -v -X POST http://localhost:3000/api/webhooks/creem \
  -H "Content-Type: application/json" \
  -H "x-creem-signature: test123" \
  -d '{"test": "data"}' \
  2>&1  < /dev/null |  grep -E "(HTTP|Connected|error)"

echo ""
echo "If you see 'Connection refused', dev server is not running"
echo "If you see '401', signature check is working (webhook code is running)"
echo "If you see '500', check the terminal running 'pnpm dev' for error details"
