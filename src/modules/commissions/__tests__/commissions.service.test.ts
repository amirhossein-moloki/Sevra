import { commissionsService } from '../commissions.service';
import { CommissionsRepo } from '../commissions.repo';
import { CommissionStatus, CommissionPaymentStatus, SessionActorType, BookingPaymentState, PaymentProvider, CommissionType, BookingSource } from '@prisma/client';

jest.mock('../commissions.repo');
jest.mock('../../audit/audit.service');

describe('Commissions Service', () => {
  describe('payCommission', () => {
    const salonId = 'salon-1';
    const commissionId = 'comm-1';
    const actor = { id: 'user-1', actorType: SessionActorType.USER };
    const input = {
      amount: 1000,
      currency: 'USD',
      status: CommissionPaymentStatus.PAID,
      method: 'CARD' as any,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully record a commission payment and update commission status to CHARGED when fully paid', async () => {
      const mockCommission = {
        id: commissionId,
        salonId,
        commissionAmount: 1000,
        status: CommissionStatus.PENDING,
      };

      (CommissionsRepo.findCommissionById as jest.Mock).mockResolvedValue(mockCommission);
      (CommissionsRepo.createCommissionPayment as jest.Mock).mockResolvedValue({ id: 'pay-1', ...input });
      (CommissionsRepo.findCommissionPayments as jest.Mock).mockResolvedValue([{ amount: 1000 }]);
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      const result = await commissionsService.payCommission(commissionId, salonId, input, actor);

      expect(CommissionsRepo.createCommissionPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionId,
          amount: input.amount,
          status: CommissionPaymentStatus.PAID,
        }),
        expect.anything()
      );

      expect(CommissionsRepo.updateBookingCommission).toHaveBeenCalledWith(
        commissionId,
        expect.objectContaining({ status: CommissionStatus.CHARGED }),
        expect.anything()
      );

      expect(result.id).toBe('pay-1');
    });

    it('should throw error if commission is not found', async () => {
      (CommissionsRepo.findCommissionById as jest.Mock).mockResolvedValue(null);
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      await expect(commissionsService.payCommission(commissionId, salonId, input, actor))
        .rejects.toThrow('Commission record not found.');
    });
  });

  describe('calculateCommission', () => {
    const bookingId = 'booking-1';
    const salonId = 'salon-1';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should calculate and create a PENDING commission for an unpaid booking', async () => {
      const mockBooking = {
        id: bookingId,
        salonId,
        amountDueSnapshot: 10000,
        currencySnapshot: 'IRR',
        source: BookingSource.ONLINE,
        paymentState: BookingPaymentState.UNPAID,
        payments: [],
      };

      const mockPolicy = {
        id: 'policy-1',
        type: CommissionType.PERCENT,
        percentBps: 500, // 5%
        isActive: true,
        applyToOnlineOnly: true,
      };

      (CommissionsRepo.findBookingForCommission as jest.Mock).mockResolvedValue(mockBooking);
      (CommissionsRepo.findPolicyBySalonId as jest.Mock).mockResolvedValue(mockPolicy);
      (CommissionsRepo.createBookingCommission as jest.Mock).mockResolvedValue({ id: 'comm-1', commissionAmount: 500 });
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      await commissionsService.calculateCommission(bookingId);

      expect(CommissionsRepo.createBookingCommission).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CommissionStatus.PENDING,
          commissionAmount: 500,
        }),
        expect.anything()
      );
      expect(CommissionsRepo.createCommissionPayment).not.toHaveBeenCalled();
    });

    it('should calculate and create a CHARGED commission for a PAID online booking', async () => {
      const mockBooking = {
        id: bookingId,
        salonId,
        amountDueSnapshot: 10000,
        currencySnapshot: 'IRR',
        source: BookingSource.ONLINE,
        paymentState: BookingPaymentState.PAID,
        payments: [{ provider: PaymentProvider.ZARINPAL, status: 'PAID' }],
      };

      const mockPolicy = {
        id: 'policy-1',
        type: CommissionType.PERCENT,
        percentBps: 500, // 5%
        isActive: true,
        applyToOnlineOnly: true,
      };

      (CommissionsRepo.findBookingForCommission as jest.Mock).mockResolvedValue(mockBooking);
      (CommissionsRepo.findPolicyBySalonId as jest.Mock).mockResolvedValue(mockPolicy);
      (CommissionsRepo.createBookingCommission as jest.Mock).mockResolvedValue({ id: 'comm-1', commissionAmount: 500 });
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      await commissionsService.calculateCommission(bookingId);

      expect(CommissionsRepo.createBookingCommission).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CommissionStatus.CHARGED,
          commissionAmount: 500,
        }),
        expect.anything()
      );

      expect(CommissionsRepo.createCommissionPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
          status: CommissionPaymentStatus.PAID,
        }),
        expect.anything()
      );
    });

    it('should NOT calculate commission for IN_PERSON bookings', async () => {
      const mockBooking = {
        id: bookingId,
        salonId,
        amountDueSnapshot: 10000,
        currencySnapshot: 'IRR',
        source: BookingSource.IN_PERSON,
        paymentState: BookingPaymentState.UNPAID,
        payments: [],
      };

      const mockPolicy = {
        id: 'policy-1',
        type: CommissionType.PERCENT,
        percentBps: 500,
        isActive: true,
        applyToOnlineOnly: true,
      };

      (CommissionsRepo.findBookingForCommission as jest.Mock).mockResolvedValue(mockBooking);
      (CommissionsRepo.findPolicyBySalonId as jest.Mock).mockResolvedValue(mockPolicy);
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      const result = await commissionsService.calculateCommission(bookingId);

      expect(result).toBeNull();
      expect(CommissionsRepo.createBookingCommission).not.toHaveBeenCalled();
    });
  });
});
