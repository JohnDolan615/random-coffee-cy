import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQueuesHealth } from '../../../bot/src/queue/bull';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'connected';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'disconnected';
    }
    
    // Check queue system health
    const queueHealth = await getQueuesHealth();
    
    // Get basic stats
    const [userCount, pairingCount] = await Promise.all([
      prisma.user.count(),
      prisma.pairing.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        queues: queueHealth,
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      metrics: {
        totalUsers: userCount,
        pairingsLast24h: pairingCount,
        uptime: process.uptime()
      },
      version: '1.0.0'
    };
    
    return NextResponse.json(health);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}