import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { bot } from '../../../bot/src/index';

// Webhook handler for Telegram updates (optional - disabled by default)
// To enable: set USE_WEBHOOK=true and configure webhook URL

const handleUpdate = webhookCallback(bot, 'std/http', {
  timeoutMilliseconds: 30000,
});

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (providedSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Check if webhooks are enabled
    if (process.env.USE_WEBHOOK !== 'true') {
      return NextResponse.json(
        { error: 'Webhooks are disabled. Bot is running in long polling mode.' },
        { status: 403 }
      );
    }
    
    // Handle the update
    const update = await request.json();
    await handleUpdate(update);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: process.env.USE_WEBHOOK === 'true' ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
}