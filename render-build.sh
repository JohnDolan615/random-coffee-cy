#!/bin/bash

# Render-specific build script
# This script handles the build process for Render deployment

set -e  # Exit on any error

echo "🚀 Starting Render build process..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are we in the right directory?"
    exit 1
fi

# Install dependencies with verbose logging
echo "📦 Installing dependencies..."
npm ci

# Build shared package first
echo "🔧 Building shared package..."
npm run build:shared

# Verify shared package was built
if [ ! -d "packages/shared/dist" ]; then
    echo "❌ Shared package build failed - dist directory not found"
    exit 1
fi

echo "✅ Shared package built successfully"

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Build Next.js app using root command
echo "🏗️  Building Next.js application..."
npm run build:next-only --workspace=apps/next

echo "✅ Build completed successfully!"