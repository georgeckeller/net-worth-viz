#!/bin/bash

# Net Worth Visualization - Deployment Script

set -e

echo "🏗️  Building Net Worth Dashboard..."
npm run build:quiet

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting:networth

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://YOUR_PROJECT_ID.web.app"
