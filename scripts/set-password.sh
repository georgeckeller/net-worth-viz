#!/bin/bash
# Sets the dashboard password in both .env.local and Firebase Secret Manager
# Usage: bash scripts/set-password.sh "YourNewPassword"

set -e

PASSWORD="$1"
PROJECT="${2:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PASSWORD" ]; then
  echo "Usage: bash scripts/set-password.sh \"YourNewPassword\" [project-id]"
  exit 1
fi

HASH=$(node -e "console.log(require('crypto').createHash('sha256').update('$PASSWORD').digest('hex'))")

# Update .env.local
if [ -f .env.local ]; then
  sed -i "s/^VITE_PASSWORD_HASH=.*/VITE_PASSWORD_HASH=$HASH/" .env.local
  echo "✓ Updated .env.local"
else
  echo "⚠ .env.local not found — skipping"
fi

# Update Firebase secret
echo -n "$HASH" | firebase functions:secrets:set PASSWORD_HASH --project "$PROJECT"
echo "✓ Updated Firebase secret"

# Rebuild and redeploy functions
cd functions && npm run build && cd ..
firebase deploy --only functions --project "$PROJECT"
echo ""
echo "✓ Password updated and deployed. You can now log in with the new password."
