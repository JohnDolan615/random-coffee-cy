import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Bot webhook is disabled for web deployment
  // The bot runs separately as a background service
  return NextResponse.json(
    { error: 'Bot webhook endpoint disabled. Bot runs as separate service.' },
    { status: 503 }
  );
}

// Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: process.env.USE_WEBHOOK === 'true' ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
}