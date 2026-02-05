import { salonService } from './salon.service';
import { salonRepository } from './salon.repository';
import createHttpError from 'http-errors';

// Mock the repository
jest.mock('./salon.repository', () => ({
  salonRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

describe('SalonService', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSalon', () => {
    it('should create a new salon if the slug is unique', async () => {
      const salonData = {
        name: 'Test Salon',
        slug: 'test-salon',
        ownerId: 'owner-id-123',
      };
      const createdSalon = { ...salonData, id: 'salon-id-123', isActive: true };

      (salonRepository.findBySlug as jest.Mock).mockResolvedValue(null);
      (salonRepository.create as jest.Mock).mockResolvedValue(createdSalon);

      const result = await salonService.createSalon(salonData);

      expect(salonRepository.findBySlug).toHaveBeenCalledWith(salonData.slug);
      expect(salonRepository.create).toHaveBeenCalledWith(salonData);
      expect(result).toEqual(createdSalon);
    });

    it('should throw a 409 conflict error if the slug already exists', async () => {
      const salonData = {
        name: 'Test Salon',
        slug: 'test-salon',
        ownerId: 'owner-id-123',
      };
      const existingSalon = {
        ...salonData,
        id: 'salon-id-456',
        isActive: true,
      };

      (salonRepository.findBySlug as jest.Mock).mockResolvedValue(
        existingSalon,
      );

      await expect(salonService.createSalon(salonData)).rejects.toThrow(
        createHttpError(409, 'A salon with this slug already exists'),
      );

      expect(salonRepository.findBySlug).toHaveBeenCalledWith(salonData.slug);
      expect(salonRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getSalonById', () => {
    it('should return a salon if it is found', async () => {
      const salonId = 'salon-id-123';
      const salon = {
        id: salonId,
        name: 'Test Salon',
        slug: 'test-salon',
        ownerId: 'owner-id-123',
        isActive: true,
      };

      (salonRepository.findById as jest.Mock).mockResolvedValue(salon);

      const result = await salonService.getSalonById(salonId);

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(result).toEqual(salon);
    });

    it('should throw a 404 not found error if the salon does not exist', async () => {
      const salonId = 'non-existent-id';
      (salonRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(salonService.getSalonById(salonId)).rejects.toThrow(
        createHttpError(404, 'Salon not found'),
      );

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
    });
  });

  describe('updateSalon', () => {
    const salonId = 'salon-id-123';
    const existingSalon = {
      id: salonId,
      name: 'Old Name',
      slug: 'old-slug',
      ownerId: 'owner-id-123',
      isActive: true,
    };
    const updateData = { name: 'New Name', slug: 'new-slug' };

    it('should update the salon successfully', async () => {
      const updatedSalon = { ...existingSalon, ...updateData };
      (salonRepository.findById as jest.Mock).mockResolvedValue(existingSalon);
      (salonRepository.findBySlug as jest.Mock).mockResolvedValue(null);
      (salonRepository.update as jest.Mock).mockResolvedValue(updatedSalon);

      const result = await salonService.updateSalon(salonId, updateData);

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(salonRepository.findBySlug).toHaveBeenCalledWith(updateData.slug);
      expect(salonRepository.update).toHaveBeenCalledWith(salonId, updateData);
      expect(result).toEqual(updatedSalon);
    });

    it('should throw a 404 error if the salon to update is not found', async () => {
      (salonRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        salonService.updateSalon(salonId, updateData),
      ).rejects.toThrow(createHttpError(404, 'Salon not found'));

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(salonRepository.update).not.toHaveBeenCalled();
    });

    it('should throw a 409 error if the new slug already exists', async () => {
      const anotherSalon = {
        id: 'salon-id-456',
        name: 'Another Salon',
        slug: 'new-slug',
      };
      (salonRepository.findById as jest.Mock).mockResolvedValue(existingSalon);
      (salonRepository.findBySlug as jest.Mock).mockResolvedValue(anotherSalon);

      await expect(
        salonService.updateSalon(salonId, updateData),
      ).rejects.toThrow(
        createHttpError(409, 'A salon with this slug already exists'),
      );

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(salonRepository.findBySlug).toHaveBeenCalledWith(updateData.slug);
      expect(salonRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSalon', () => {
    const salonId = 'salon-id-123';
    const existingSalon = {
      id: salonId,
      name: 'Test Salon',
      slug: 'test-salon',
    };

    it('should soft delete the salon successfully', async () => {
      (salonRepository.findById as jest.Mock).mockResolvedValue(existingSalon);
      (salonRepository.softDelete as jest.Mock).mockResolvedValue({
        ...existingSalon,
        isActive: false,
      });

      await salonService.deleteSalon(salonId);

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(salonRepository.softDelete).toHaveBeenCalledWith(salonId);
    });

    it('should throw a 404 error if the salon to delete is not found', async () => {
      (salonRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(salonService.deleteSalon(salonId)).rejects.toThrow(
        createHttpError(404, 'Salon not found'),
      );

      expect(salonRepository.findById).toHaveBeenCalledWith(salonId);
      expect(salonRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
