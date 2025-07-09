#!/bin/bash

# Deploy script for Hall of Honor
echo "🚀 Starting deployment..."

# Navigate to project directory
cd /srv/app/hall-of-honor

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build project
echo "🔨 Building project..."
npm run build

# Create log directory if not exists
mkdir -p /var/log/hall-of-honor

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart hall-of-honor || pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed!" 