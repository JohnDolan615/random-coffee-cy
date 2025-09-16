#!/usr/bin/env node

/**
 * Build script for shared package that works better on Render
 * This ensures the shared package is built before the Next.js app
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building shared package...');

// Build the shared package
try {
  execSync('npm run build --workspace=packages/shared', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname)
  });
  console.log('✓ Shared package built successfully');
} catch (error) {
  console.error('✗ Failed to build shared package:', error.message);
  process.exit(1);
}

// Verify the build output exists
const distPath = path.join(__dirname, 'packages', 'shared', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('✗ Shared package dist directory not found');
  process.exit(1);
}

console.log('✓ Shared package ready for Next.js build');