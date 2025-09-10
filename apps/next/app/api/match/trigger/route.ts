import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { validateAndParse, manualMatchSchema } from '@/lib/validators';
import { matchingQueue } from '@random-coffee/shared';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();
    
    const body = await request.json();
    const { timezone } = validateAndParse(manualMatchSchema, body);
    
    // Add manual matching job to queue
    if (!matchingQueue) {
      throw new Error('Matching queue not available');
    }
    
    const job = await matchingQueue.add(
      'manual-match',
      { 
        timezone,
        manual: true,
        triggeredBy: 'admin',
        triggeredAt: new Date().toISOString()
      },
      {
        priority: 100, // High priority for manual triggers
        attempts: 1
      }
    );
    
    return NextResponse.json({
      success: true,
      message: `Manual matching job queued for timezone: ${timezone}`,
      jobId: job.id
    });
    
  } catch (error) {
    console.error('Manual match trigger failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger matching'
      },
      { status: 400 }
    );
  }
}

// Alternative GET endpoint for quick triggers
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const timezone = url.searchParams.get('timezone') || 'UTC';
    
    if (!matchingQueue) {
      throw new Error('Matching queue not available');
    }
    
    const job = await matchingQueue.add(
      'manual-match',
      { 
        timezone,
        manual: true,
        triggeredBy: 'admin-get',
        triggeredAt: new Date().toISOString()
      },
      {
        priority: 100,
        attempts: 1
      }
    );
    
    // Return HTML response for easy browser triggering
    return new NextResponse(
      `
      <html>
        <head><title>Manual Match Triggered</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>✅ Manual Matching Triggered</h1>
          <p><strong>Timezone:</strong> ${timezone}</p>
          <p><strong>Job ID:</strong> ${job.id}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <br>
          <a href="/dashboard" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Back to Dashboard</a>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
    
  } catch (error) {
    console.error('Manual match trigger failed:', error);
    
    return new NextResponse(
      `
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>❌ Error</h1>
          <p>${error instanceof Error ? error.message : 'Failed to trigger matching'}</p>
          <a href="/dashboard">← Back to Dashboard</a>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}