import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { DashboardStats } from '@random-coffee/shared';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get user stats
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          profile: {
            isPaused: false,
            isOnboarded: true
          }
        }
      })
    ]);
    
    // Get pairing stats
    const [todaysPairings, allPairings, completedPairings] = await Promise.all([
      prisma.pairing.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      prisma.pairing.findMany({
        where: {
          status: { in: ['CONFIRMED', 'DONE'] }
        },
        select: {
          status: true,
          createdAt: true,
          feedback: {
            select: {
              rating: true,
              noShow: true
            }
          }
        }
      }),
      prisma.pairing.count({
        where: { status: 'DONE' }
      })
    ]);
    
    // Calculate acceptance rate
    const totalProposals = await prisma.pairing.count();
    const acceptedPairings = allPairings.length;
    const acceptanceRate = totalProposals > 0 ? acceptedPairings / totalProposals : 0;
    
    // Calculate show-up rate
    const pairingsWithFeedback = allPairings.filter(p => p.feedback.length > 0);
    const showUps = pairingsWithFeedback.filter(p => 
      !p.feedback.some(f => f.noShow)
    ).length;
    const showUpRate = pairingsWithFeedback.length > 0 ? showUps / pairingsWithFeedback.length : 0;
    
    // Calculate average rating
    const allRatings = allPairings.flatMap(p => p.feedback.map(f => f.rating));
    const avgRating = allRatings.length > 0 ? 
      allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0;
    
    // Get revenue stats
    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thisMonthStart }
        },
        _sum: { totalAmount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { 
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        },
        _sum: { totalAmount: true }
      })
    ]);
    
    const stats: DashboardStats = {
      totalUsers,
      activeUsers,
      todaysPairings,
      acceptanceRate,
      showUpRate,
      avgRating,
      revenue: {
        thisMonth: thisMonthRevenue._sum.totalAmount || 0,
        lastMonth: lastMonthRevenue._sum.totalAmount || 0,
      }
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}