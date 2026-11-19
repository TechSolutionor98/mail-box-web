#!/usr/bin/env bash
# ==============================================================================
# VPS AUTO-DEPLOYMENT SCRIPT FOR TECHSOLUTIONOR HOSTCONTROL
# ==============================================================================

set -e

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📦 Pulling latest changes from Git..."
git pull origin main || git pull origin master

# 2. Install dependencies
echo "📥 Installing dependencies..."
npm install --legacy-peer-deps

# 3. Build Next.js production frontend
echo "🔨 Building Next.js Frontend..."
npm run build

# 4. Start or Reload PM2
echo "🔄 Reloading PM2 processes..."
if pm2 describe hostcontrol-backend > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js
else
    pm2 start ecosystem.config.js
fi

pm2 save

echo "✅ Deployment completed successfully!"
echo "📡 Next.js running on port 3000"
echo "📡 Express Backend running on port 4000"
