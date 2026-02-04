import { commissionsService } from '../commissions.service';
import { CommissionsRepo } from '../commissions.repo';
import { CommissionStatus, CommissionPaymentStatus, SessionActorType } from '@prisma/client';

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

    it('should successfully record a commission payment and update commission status to PAID when fully paid', async () => {
      const mockCommission = {
        id: commissionId,
        salonId,
        commissionAmount: 1000,
        currency: 'USD',
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
        expect.objectContaining({ status: CommissionStatus.PAID }),
        expect.anything()
      );

      expect(result.id).toBe('pay-1');
    });

    it('should throw error if currency mismatch', async () => {
      const mockCommission = {
        id: commissionId,
        salonId,
        commissionAmount: 1000,
        currency: 'IRR', // Mismatch
        status: CommissionStatus.PENDING,
      };

      (CommissionsRepo.findCommissionById as jest.Mock).mockResolvedValue(mockCommission);
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      await expect(commissionsService.payCommission(commissionId, salonId, input, actor))
        .rejects.toThrow('Currency mismatch.');
    });

    it('should throw error if commission is not found', async () => {
      (CommissionsRepo.findCommissionById as jest.Mock).mockResolvedValue(null);
      (CommissionsRepo.transaction as jest.Mock).mockImplementation((cb) => cb({}));

      await expect(commissionsService.payCommission(commissionId, salonId, input, actor))
        .rejects.toThrow('Commission record not found.');
    });
  });
});
