
import { BookingSource, CommissionStatus, CommissionType, CommissionPaymentStatus, Prisma, SessionActorType, BookingPaymentState, CommissionPaymentMethod, PaymentProvider } from '@prisma/client';
import { CommissionsRepo } from './commissions.repo';
import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { ListCommissionsQuery, RecordCommissionPaymentInput, UpsertPolicyInput } from './commissions.validators';
import { auditService } from '../audit/audit.service';

export const commissionsService = {
  async getPolicy(salonId: string) {
    const policy = await CommissionsRepo.findPolicyBySalonId(salonId);
    if (!policy) {
      throw new AppError('Commission policy not found for this salon.', httpStatus.NOT_FOUND);
    }
    return policy;
  },

  async upsertPolicy(
    salonId: string,
    input: UpsertPolicyInput,
    actor: { id: string; actorType: SessionActorType },
    context?: { ip?: string; userAgent?: string }
  ) {
    const existingPolicy = await CommissionsRepo.findPolicyBySalonId(salonId);

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

    const policy = await CommissionsRepo.upsertPolicy(salonId, data);

    await auditService.recordLog({
      salonId,
      actorId: actor.id,
      actorType: actor.actorType,
      action: 'COMMISSION_POLICY_UPSERT',
      entity: 'SalonCommissionPolicy',
      entityId: policy.id,
      oldData: existingPolicy,
      newData: policy,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return policy;
  },

  async calculateCommission(bookingId: string) {
    return CommissionsRepo.transaction(async (tx) => {
      // 1. Fetch booking
      const booking = await CommissionsRepo.findBookingForCommission(bookingId, tx);

      if (!booking) return null;
      if (booking.commission) return booking.commission; // Already calculated

      // 2. Fetch policy
      const policy = await CommissionsRepo.findPolicyBySalonId(booking.salonId, tx);

      if (!policy || !policy.isActive) return null;

      // 3. Apply filters
      // We only take commission for ONLINE bookings.
      // In-person bookings are not charged as the platform did not provide the booking service.
      if (booking.source !== BookingSource.ONLINE) {
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

      // 5. Determine if it should be automatically settled
      // If the booking is already PAID and it was paid via an online provider,
      // we assume the platform has collected the money and thus the commission.
      const hasOnlinePayment = booking.payments?.some(p => p.provider !== PaymentProvider.MANUAL);
      const shouldAutoSettle = booking.paymentState === BookingPaymentState.PAID && hasOnlinePayment;
      const status = shouldAutoSettle ? CommissionStatus.CHARGED : CommissionStatus.PENDING;

      // 6. Create BookingCommission record
      const commission = await CommissionsRepo.createBookingCommission({
        bookingId: booking.id,
        salonId: booking.salonId,
        status,
        baseAmount: booking.amountDueSnapshot,
        currency: commissionCurrency,
        type: policy.type,
        percentBps: policy.percentBps,
        fixedAmount: policy.fixedAmount,
        commissionAmount: commissionAmount,
        calculatedAt: new Date(),
        chargedAt: shouldAutoSettle ? new Date() : null,
      }, tx);

      // 7. If auto-settled, record the payment
      if (shouldAutoSettle) {
        await CommissionsRepo.createCommissionPayment({
          commissionId: commission.id,
          amount: commissionAmount,
          currency: commissionCurrency,
          status: CommissionPaymentStatus.PAID,
          method: CommissionPaymentMethod.ONLINE,
          paidAt: new Date(),
          referenceCode: `AUTO_SETTLE_${booking.id}`,
        }, tx);
      }

      return commission;
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

  async payCommission(
    commissionId: string,
    salonId: string,
    input: RecordCommissionPaymentInput,
    actor: { id: string; actorType: SessionActorType },
    context?: { ip?: string; userAgent?: string }
  ) {
    return CommissionsRepo.transaction(async (tx) => {
      const commission = await CommissionsRepo.findCommissionById(commissionId, salonId, tx);

      if (!commission) {
        throw new AppError('Commission record not found.', httpStatus.NOT_FOUND);
      }

      const payment = await CommissionsRepo.createCommissionPayment({
        commissionId: commissionId,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        method: input.method,
        referenceCode: input.referenceCode,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      }, tx);

      await auditService.recordLog({
        salonId,
        actorId: actor.id,
        actorType: actor.actorType,
        action: 'COMMISSION_PAYMENT_RECORD',
        entity: 'CommissionPayment',
        entityId: payment.id,
        newData: payment,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });

      // If fully paid, update commission status
      const allPayments = await CommissionsRepo.findCommissionPayments(commissionId, CommissionPaymentStatus.PAID, tx);

      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= commission.commissionAmount) {
        await CommissionsRepo.updateBookingCommission(commissionId, {
          status: CommissionStatus.CHARGED,
          chargedAt: new Date()
        }, tx);
      }

      return payment;
    });
  }
};
