#\!/bin/bash

echo "Checking Creem Configuration..."
echo "================================"
echo ""

# Check API key format
API_KEY=$(grep "CREEM_API_KEY=" .env.local  < /dev/null |  cut -d'=' -f2 | tr -d '"')
if [[ $API_KEY == sk_test_* ]]; then
  echo "✅ API Key: TEST mode (sk_test_...)"
elif [[ $API_KEY == sk_live_* ]]; then
  echo "❌ API Key: PRODUCTION mode (sk_live_...)"
  echo "   Problem: Using production key with test mode setting\!"
else
  echo "⚠️  API Key: Unknown format"
  echo "   First 10 chars: ${API_KEY:0:10}..."
fi
echo ""

# Check test mode setting
TEST_MODE=$(grep "NEXT_PUBLIC_CREEM_TEST_MODE=" .env.local | cut -d'=' -f2 | tr -d '"')
echo "Test Mode Setting: $TEST_MODE"
echo ""

# Check product IDs
echo "Product IDs:"
PROPLUS_MONTHLY=$(grep "CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY=" .env.local | cut -d'=' -f2 | tr -d '"')
echo "  Pro+ Monthly: $PROPLUS_MONTHLY"

if [[ $PROPLUS_MONTHLY == prod_* ]]; then
  echo "  ✅ Looks like a valid Creem product ID"
else
  echo "  ⚠️  Unexpected format (should start with 'prod_')"
fi
echo ""

# Summary
echo "================================"
echo "Summary:"
echo "================================"
echo ""
if [[ $API_KEY == sk_test_* ]] && [[ $TEST_MODE == "true" ]]; then
  echo "✅ Configuration looks consistent (test mode)"
  echo ""
  echo "The 403 error is likely because:"
  echo "1. This specific subscription can't be upgraded in Creem"
  echo "2. Or the product ID doesn't match what's in Creem dashboard"
  echo ""
  echo "Try manually upgrading this subscription in Creem Dashboard"
elif [[ $API_KEY == sk_live_* ]] && [[ $TEST_MODE == "true" ]]; then
  echo "❌ MISMATCH: Using production API key with test mode"
  echo ""
  echo "Fix: Get your TEST mode API key from Creem dashboard"
  echo "     and update CREEM_API_KEY in .env.local"
else
  echo "⚠️  Unable to determine configuration consistency"
  echo ""
  echo "Check manually in Creem Dashboard:"
  echo "1. Is subscription sub_5EM6IgULEBVjEtMx5OH0TT in test or production?"
  echo "2. Does your API key match that mode?"
fi
