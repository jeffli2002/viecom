#!/bin/bash
# Production script to create admin account

echo "🔐 Creating Admin Account for Viecom"
echo "===================================="

# Set environment variables
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@viecom.pro}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123456}"

# Run the create admin script
pnpm tsx src/scripts/create-admin.ts

echo ""
echo "✅ Admin account setup complete!"
echo ""
echo "📧 Email: $ADMIN_EMAIL"
echo "🔒 Password: $ADMIN_PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Change the password after first login!"
echo ""
echo "🔗 Login at: https://www.viecom.pro/admin/login"

