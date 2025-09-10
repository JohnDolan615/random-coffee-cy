import { prisma } from './prisma';
import pino from 'pino';

const log = pino();

export async function processRefund(paymentId: string, reason: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'REFUNDED') {
      throw new Error('Payment already refunded');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    });

    // Deactivate related subscriptions if applicable
    if (payment.productType === 'pro_monthly') {
      await prisma.subscription.updateMany({
        where: {
          userId: payment.userId,
          type: 'PRO_MONTHLY',
          status: 'active'
        },
        data: { status: 'cancelled' }
      });
    }

    log.info({ 
      paymentId, 
      userId: payment.userId, 
      reason,
      amount: payment.totalAmount 
    }, 'Payment refunded');

    return { success: true };

  } catch (error) {
    log.error(error, 'Error processing refund');
    throw error;
  }
}

export async function getPaymentStats(dateFrom?: string, dateTo?: string) {
  try {
    const where: any = {
      status: 'COMPLETED'
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        totalAmount: true,
        productType: true,
        createdAt: true
      }
    });

    const stats = {
      totalRevenue: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      totalTransactions: payments.length,
      byProduct: {} as Record<string, { count: number; revenue: number }>,
      recentTransactions: payments.slice(-10)
    };

    // Group by product type
    payments.forEach(payment => {
      if (!stats.byProduct[payment.productType]) {
        stats.byProduct[payment.productType] = { count: 0, revenue: 0 };
      }
      stats.byProduct[payment.productType].count += 1;
      stats.byProduct[payment.productType].revenue += payment.totalAmount;
    });

    return stats;

  } catch (error) {
    log.error(error, 'Error getting payment stats');
    throw error;
  }
}

export async function getActiveSubscriptions() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        status: 'active',
        endDate: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            telegramId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return subscriptions;

  } catch (error) {
    log.error(error, 'Error getting active subscriptions');
    throw error;
  }
}

export async function validateTelegramPayment(
  telegramChargeId: string,
  invoicePayload: string,
  totalAmount: number
): Promise<boolean> {
  try {
    // In a real implementation, this would verify the payment with Telegram's API
    // For now, we'll do basic validation
    
    const existingPayment = await prisma.payment.findFirst({
      where: { telegramChargeId }
    });

    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return false; // Already processed
    }

    // Validate payload format
    if (!invoicePayload.match(/^(pro_monthly|extra_match|reroll|priority)_\d+$/)) {
      return false;
    }

    // Validate amount
    const productType = invoicePayload.split('_')[0] + '_' + invoicePayload.split('_')[1];
    const expectedAmounts: Record<string, number> = {
      'pro_monthly': 770,
      'extra_match': 150,
      'reroll': 60,
      'priority': 120
    };

    if (expectedAmounts[productType] !== totalAmount) {
      return false;
    }

    return true;

  } catch (error) {
    log.error(error, 'Error validating Telegram payment');
    return false;
  }
}