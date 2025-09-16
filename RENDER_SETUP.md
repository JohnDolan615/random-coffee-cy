# Render Deployment Configuration

## ✅ Exact Settings for Render.com

### Web Service Settings:
- **Build Command**: `npm run build`
- **Start Command**: `pnpm -C apps/next start`

### Environment Variables:
```
NODE_ENV=production
DATABASE_URL=[Your database connection string]
REDIS_URL=[Your Redis connection string]
BOT_TOKEN=[Your Telegram bot token]
WEBHOOK_SECRET=[Your webhook secret]
APP_URL=https://[your-app-name].onrender.com
```

## How It Works:

1. **`npm run build`** triggers the universal build script (`build.js`)
2. **Build script automatically**:
   - Detects project root from any directory
   - Installs all dependencies (`npm ci`)
   - Builds shared package first
   - Generates Prisma client
   - Builds Next.js app with all dependencies resolved

3. **`pnpm -C apps/next start`** starts the Next.js app from the correct directory

## ✅ Tested Scenarios:
- ✅ Build from root directory
- ✅ Build from Next.js subdirectory (where Render auto-detects)
- ✅ Works with npm and pnpm
- ✅ Handles workspace dependencies correctly

## Troubleshooting:
If build still fails, check that all environment variables are set in Render dashboard.

The universal build script (`build.js`) is present in both:
- Root directory: `/build.js`
- Next.js directory: `/apps/next/build.js`

This ensures it works regardless of where Render decides to build from.