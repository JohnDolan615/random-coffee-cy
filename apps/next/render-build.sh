#!/bin/bash

# Fallback build script for when Render builds from apps/next directory
# This script navigates to the root and runs the proper build

set -e

echo "🚀 Running fallback build from apps/next directory"
echo "Current directory: $(pwd)"

# Navigate to the root directory
cd ../..

echo "Moved to root directory: $(pwd)"

# Manual build process to avoid recursion
echo "Running manual build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build shared package
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

# Build Next.js app directly
echo "🏗️  Building Next.js application..."
cd apps/next
npx next build

echo "✅ Fallback build completed!"