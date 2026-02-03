
import { BookingSource, CommissionStatus, CommissionType, CommissionPaymentStatus, Prisma } from '@prisma/client';
import { CommissionsRepo } from './commissions.repo';
import { prisma } from '../../config/prisma';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { ListCommissionsQuery, RecordCommissionPaymentInput, UpsertPolicyInput } from './commissions.validators';

export const commissionsService = {
  async getPolicy(salonId: string) {
    const policy = await CommissionsRepo.findPolicyBySalonId(salonId);
    if (!policy) {
      throw new AppError('Commission policy not found for this salon.', httpStatus.NOT_FOUND);
    }
    return policy;
  },

  async upsertPolicy(salonId: string, input: UpsertPolicyInput) {
    const data: Prisma.SalonCommissionPolicyCreateInput = {
      type: input.type,
      percentBps: input.percentBps,
      fixedAmount: input.fixedAmount,
      currency: input.currency,
      applyToOnlineOnly: input.applyToOnlineOnly ?? true,
      minimumFeeAmount: input.minimumFeeAmount,
      isActive: input.isActive ?? true,
      salon: { connect: { id: salonId } },
    };

    return CommissionsRepo.upsertPolicy(salonId, data);
  },

  async calculateCommission(bookingId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { commission: true }
      });

      if (!booking) return null;
      if (booking.commission) return booking.commission; // Already calculated

      // 2. Fetch policy
      const policy = await tx.salonCommissionPolicy.findUnique({
        where: { salonId: booking.salonId }
      });

      if (!policy || !policy.isActive) return null;

      // 3. Apply filters
      if (policy.applyToOnlineOnly && booking.source !== BookingSource.ONLINE) {
        return null;
      }

      // 4. Calculate amount
      let commissionAmount = 0;
      const commissionCurrency = booking.currencySnapshot;

      if (policy.type === CommissionType.PERCENT && policy.percentBps) {
        commissionAmount = Math.floor((booking.amountDueSnapshot * policy.percentBps) / 10000);
      } else if (policy.type === CommissionType.FIXED && policy.fixedAmount) {
        // If currencies don't match, we still use fixedAmount but it's risky.
        // For MVP, we assume salon currency matches booking currency.
        commissionAmount = policy.fixedAmount;

        if (policy.currency && policy.currency !== booking.currencySnapshot) {
          console.warn(`Commission policy currency (${policy.currency}) does not match booking currency (${booking.currencySnapshot}) for booking ${booking.id}`);
        }
      }

      // Apply minimum fee
      if (policy.minimumFeeAmount && commissionAmount < policy.minimumFeeAmount) {
        commissionAmount = policy.minimumFeeAmount;
      }

      // 5. Create BookingCommission record
      return tx.bookingCommission.create({
        data: {
          booking: { connect: { id: booking.id } },
          salon: { connect: { id: booking.salonId } },
          status: CommissionStatus.PENDING,
          baseAmount: booking.amountDueSnapshot,
          currency: commissionCurrency,
          type: policy.type,
          percentBps: policy.percentBps,
          fixedAmount: policy.fixedAmount,
          commissionAmount: commissionAmount,
          calculatedAt: new Date(),
        }
      });
    });
  },

  async listCommissions(salonId: string, query: ListCommissionsQuery) {
    const { page = 1, pageSize = 20, status, dateFrom, dateTo } = query;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.BookingCommissionWhereInput = {
      status,
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      }
    };

    const { commissions, totalItems } = await CommissionsRepo.listCommissions(salonId, where, skip, take);

    return {
      data: commissions,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      }
    };
  },

  async recordPayment(commissionId: string, salonId: string, input: RecordCommissionPaymentInput) {
    return prisma.$transaction(async (tx) => {
      const commission = await tx.bookingCommission.findFirst({
        where: { id: commissionId, salonId }
      });

      if (!commission) {
        throw new AppError('Commission record not found.', httpStatus.NOT_FOUND);
      }

      const payment = await tx.commissionPayment.create({
        data: {
          commission: { connect: { id: commissionId } },
          amount: input.amount,
          currency: input.currency,
          status: input.status,
          method: input.method,
          referenceCode: input.referenceCode,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        }
      });

      // If fully paid, update commission status
      // For MVP, we might just assume one payment covers it or sum them up
      const allPayments = await tx.commissionPayment.findMany({
        where: { commissionId, status: CommissionPaymentStatus.PAID }
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= commission.commissionAmount) {
        await tx.bookingCommission.update({
          where: { id: commissionId },
          data: {
            status: CommissionStatus.CHARGED, // or ACCRUED then CHARGED. Let's use CHARGED for paid.
            chargedAt: new Date()
          }
        });
      }

      return payment;
    });
  }
};
