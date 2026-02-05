import * as userService from './users.service';
import * as userRepo from './users.repo';
import { UserRole, SessionActorType } from '@prisma/client';
import AppError from '../../common/errors/AppError';
import { auditService } from '../audit/audit.service';

// Mock the user repository
jest.mock('./users.repo');
const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;

// Mock audit service
jest.mock('../audit/audit.service', () => ({
  auditService: {
    recordLog: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStaffMember', () => {
    it('should return a staff member if found', async () => {
      // Arrange
      const salonId = 'salon-id-1';
      const userId = 'user-id-1';
      const mockUser = {
        id: userId,
        salonId: salonId,
        fullName: 'Test User',
        phone: '1234567890',
        passwordHash: 'hashedpassword',
        phoneVerifiedAt: new Date(),
        role: UserRole.STAFF, // Added required field
        isActive: true,
        isPublic: false, // Added required field
        publicName: null, // Added required field
        bio: null, // Added required field
        avatarUrl: null, // Added required field
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepo.findUserById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getStaffMember(salonId, userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockedUserRepo.findUserById).toHaveBeenCalledWith(salonId, userId);
      expect(mockedUserRepo.findUserById).toHaveBeenCalledTimes(1);
    });

    it('should throw if staff member is not found', async () => {
      // Arrange
      const salonId = 'salon-id-1';
      const userId = 'user-id-not-found';

      mockedUserRepo.findUserById.mockResolvedValue(null);

      // Assert
      await expect(userService.getStaffMember(salonId, userId)).rejects.toThrow(
        new AppError('Staff member not found', 404)
      );
      expect(mockedUserRepo.findUserById).toHaveBeenCalledWith(salonId, userId);
      expect(mockedUserRepo.findUserById).toHaveBeenCalledTimes(1);
    });
  });

  describe('createStaffMember', () => {
    it('should create a staff member and record audit log', async () => {
      const salonId = 'salon-1';
      const data = { fullName: 'John Doe', phone: '123456789', role: UserRole.STAFF };
      const actor = { id: 'actor-1', actorType: SessionActorType.MANAGER };
      const mockUser = { id: 'user-1', ...data, salonId, isActive: true, createdAt: new Date(), updatedAt: new Date(), passwordHash: 'hash', phoneVerifiedAt: null, isPublic: false, publicName: null, bio: null, avatarUrl: null };

      mockedUserRepo.createUser.mockResolvedValue(mockUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await userService.createStaffMember(salonId, data, actor);

      expect(result).toEqual(mockUser);
      expect(mockedUserRepo.createUser).toHaveBeenCalledWith(salonId, data);
      expect(auditService.recordLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'USER_CREATE',
        entityId: 'user-1',
      }));
    });
  });

  describe('getStaffList', () => {
    it('should return list of staff', async () => {
      const salonId = 'salon-1';
      const mockStaff = [{ id: 'user-1', fullName: 'Staff 1' }];
      mockedUserRepo.listUsersBySalon.mockResolvedValue(mockStaff as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await userService.getStaffList(salonId);

      expect(result).toEqual(mockStaff);
      expect(mockedUserRepo.listUsersBySalon).toHaveBeenCalledWith(salonId);
    });
  });

  describe('updateStaffMember', () => {
    it('should update a staff member and record audit log', async () => {
      const salonId = 'salon-1';
      const userId = 'user-1';
      const data = { fullName: 'Updated Name' };
      const actor = { id: 'actor-1', actorType: SessionActorType.MANAGER };
      const existingUser = { id: userId, fullName: 'Old Name', salonId };
      const updatedUser = { id: userId, fullName: 'Updated Name', salonId };

      mockedUserRepo.findUserById.mockResolvedValueOnce(existingUser as any).mockResolvedValueOnce(updatedUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      mockedUserRepo.updateUser.mockResolvedValue(updatedUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await userService.updateStaffMember(salonId, userId, data, actor);

      expect(result).toEqual(updatedUser);
      expect(mockedUserRepo.updateUser).toHaveBeenCalledWith(salonId, userId, data);
      expect(auditService.recordLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'USER_UPDATE',
        entityId: userId,
      }));
    });

    it('should throw if user not found for update', async () => {
      mockedUserRepo.findUserById.mockResolvedValue(null);
      await expect(userService.updateStaffMember('s1', 'u1', {}, {id: 'a1', actorType: SessionActorType.MANAGER}))
        .rejects.toThrow(new AppError('Staff member not found', 404));
    });
  });

  describe('deleteStaffMember', () => {
    it('should soft delete a staff member and record audit log', async () => {
      const salonId = 'salon-1';
      const userId = 'user-1';
      const actor = { id: 'actor-1', actorType: SessionActorType.MANAGER };
      const existingUser = { id: userId, fullName: 'User 1', salonId };

      mockedUserRepo.findUserById.mockResolvedValue(existingUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      mockedUserRepo.softDeleteUser.mockResolvedValue({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await userService.deleteStaffMember(salonId, userId, actor);

      expect(mockedUserRepo.softDeleteUser).toHaveBeenCalledWith(salonId, userId);
      expect(auditService.recordLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'USER_DELETE',
        entityId: userId,
      }));
    });

    it('should throw if user not found for delete', async () => {
      mockedUserRepo.findUserById.mockResolvedValue(null);
      await expect(userService.deleteStaffMember('s1', 'u1', {id: 'a1', actorType: SessionActorType.MANAGER}))
        .rejects.toThrow(new AppError('Staff member not found', 404));
    });
  });
});
