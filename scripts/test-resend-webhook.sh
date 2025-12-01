#!/bin/bash

# Test Resend Webhook Endpoint
# This script tests the Resend webhook endpoint with a mock event

echo "🧪 Testing Resend Email Forwarding Webhook..."
echo ""

# Get the webhook URL (default to localhost if NEXT_PUBLIC_APP_URL is not set)
WEBHOOK_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/webhooks/resend"

echo "🌐 Webhook URL: $WEBHOOK_URL"
echo ""

# Create a mock webhook event
MOCK_EVENT=$(cat <<EOF
{
  "type": "email.received",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "data": {
    "email_id": "test-email-id-$(date +%s)",
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
    "from": "test-sender@example.com",
    "to": ["support@viecom.pro"],
    "bcc": [],
    "cc": [],
    "message_id": "<test-message-id>",
    "subject": "Test Email - Resend Forwarding Test",
    "attachments": []
  }
}
EOF
)

echo "📧 Sending mock webhook event..."
echo ""

# Send the webhook request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$MOCK_EVENT")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response Status: $HTTP_CODE"
echo "📥 Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Webhook endpoint is working!"
  echo ""
  echo "📝 Note: This is a mock event. To test with a real email:"
  echo "   1. Send an email to support@viecom.pro"
  echo "   2. Check if it gets forwarded to 994235892@qq.com"
  echo "   3. Check server logs for processing details"
else
  echo "❌ Webhook endpoint returned an error"
  echo ""
  echo "💡 Make sure:"
  echo "   1. Development server is running (pnpm dev)"
  echo "   2. Webhook URL is accessible"
  echo "   3. Environment variables are set correctly"
  exit 1
fi



