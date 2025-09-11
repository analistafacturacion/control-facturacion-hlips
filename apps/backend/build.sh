#!/bin/bash
set -e

echo "🔧 Starting build process..."

# Ensure we're in the backend directory
cd /opt/render/project/src/apps/backend

echo "📦 Installing dependencies..."
npm ci --include=dev

echo "🔨 Building TypeScript..."
npx tsc --skipLibCheck

echo "✅ Build completed successfully!"

# Copy static files if needed
if [ -d "src/static" ]; then
    echo "📁 Copying static files..."
    cp -r src/static dist/
fi

echo "🚀 Backend ready for deployment!"
