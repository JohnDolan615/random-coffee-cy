#!/usr/bin/env node

/**
 * Universal build script that works from any directory
 * Automatically detects if we're in the root or a subdirectory
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to find the project root
function findProjectRoot() {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(currentDir, 'package.json'), 'utf8'));
      if (packageJson.workspaces) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find project root with workspaces');
}

console.log('🚀 Starting universal build process...');
console.log('Current directory:', process.cwd());

try {
  // Find and navigate to project root
  const projectRoot = findProjectRoot();
  console.log('Project root found:', projectRoot);

  if (process.cwd() !== projectRoot) {
    console.log('Changing to project root...');
    process.chdir(projectRoot);
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Build shared package
  console.log('🔧 Building shared package...');
  execSync('npm run build:shared', { stdio: 'inherit' });

  // Verify shared package build
  const sharedDist = path.join(projectRoot, 'packages', 'shared', 'dist');
  if (!fs.existsSync(sharedDist)) {
    throw new Error('Shared package build failed - dist directory not found');
  }
  console.log('✅ Shared package built successfully');

  // Generate Prisma client
  console.log('🗄️  Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Build Next.js app
  console.log('🏗️  Building Next.js application...');
  const nextAppDir = path.join(projectRoot, 'apps', 'next');
  process.chdir(nextAppDir);
  execSync('npx next build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}