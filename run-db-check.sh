#\!/bin/bash

echo "================================================"
echo "Checking database for subscription and user..."
echo "================================================"
echo ""

# Get DATABASE_URL from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env* 2>/dev/null  < /dev/null |  head -1 | cut -d'=' -f2- | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in .env files"
  exit 1
fi

echo "Running SQL queries..."
echo ""

psql "$DATABASE_URL" -f check-subscription-exists.sql

echo ""
echo "================================================"
echo "Results Explanation:"
echo "================================================"
echo ""
echo "Query 1: Should show your subscription details"
echo "  - Check if 'userId' field has a value"
echo "  - Check if 'scheduledPlanId' has a value (might be NULL)"
echo ""
echo "Query 2: Should show count of subscriptions for this user"
echo ""
echo "Query 3: Should show the user record"
echo "  - Compare user 'id' with subscription 'userId'"
echo "  - They MUST match for upgrade to work"
echo ""
