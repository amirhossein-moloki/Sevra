import * as userService from './users.service';
import * as userRepo from './users.repo';
import { UserRole } from '@prisma/client'; // Import UserRole enum
import AppError from '../../common/errors/AppError';

// Mock the user repository
jest.mock('./users.repo');
const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;

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
});
