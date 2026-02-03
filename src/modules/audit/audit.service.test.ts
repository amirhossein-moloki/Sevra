import { auditService } from './audit.service';
import { AuditRepo } from './audit.repo';
import { SessionActorType } from '@prisma/client';

jest.mock('./audit.repo');
const mockedAuditRepo = AuditRepo as jest.Mocked<typeof AuditRepo>;

describe('AuditService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordLog', () => {
    it('should record a log entry successfully', async () => {
      const input = {
        salonId: 'salon-1',
        actorId: 'actor-1',
        actorType: SessionActorType.MANAGER,
        action: 'TEST_ACTION',
        entity: 'TestEntity',
        entityId: 'entity-1',
      };

      mockedAuditRepo.createLog.mockResolvedValue({ id: 'log-1', ...input, createdAt: new Date(), oldData: null, newData: null, ipAddress: null, userAgent: null });

      const result = await auditService.recordLog(input);

      expect(mockedAuditRepo.createLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'TEST_ACTION',
      }));
      expect(result).toHaveProperty('id', 'log-1');
    });

    it('should not throw if repo fails', async () => {
      mockedAuditRepo.createLog.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(auditService.recordLog({} as any)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to record audit log:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getLogs', () => {
    it('should return paginated logs', async () => {
      const salonId = 'salon-1';
      const mockLogs = [{ id: 'log-1' }];
      const mockTotal = 1;

      mockedAuditRepo.transaction.mockImplementation(async (cb) => cb({} as any));
      mockedAuditRepo.findManyLogs.mockResolvedValue(mockLogs as any);
      mockedAuditRepo.countLogs.mockResolvedValue(mockTotal);

      const result = await auditService.getLogs(salonId, { page: 1, pageSize: 10 });

      expect(result.data).toEqual(mockLogs);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
