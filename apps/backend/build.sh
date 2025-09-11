#!/bin/bash
set -e

echo "🔧 Starting build process..."
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Ensure we're in the backend directory
cd /opt/render/project/src/apps/backend

echo "📦 Installing dependencies..."
npm ci --include=dev --loglevel=verbose

echo "📋 Listing installed packages..."
npm list --depth=0 || true

echo "🔨 Building TypeScript with relaxed settings..."
npx tsc --noImplicitAny false --strict false --skipLibCheck

echo "✅ Build completed successfully!"

# Copy static files if needed
if [ -d "src/static" ]; then
    echo "📁 Copying static files..."
    cp -r src/static dist/
fi

echo "📋 Contents of dist directory:"
ls -la dist/ || echo "Dist directory not found"

echo "🚀 Backend ready for deployment!"
