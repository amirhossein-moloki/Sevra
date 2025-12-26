import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SmsService } from '../notifications/sms.service';
import argon2 from 'argon2';
import createHttpError from 'http-errors';

jest.mock('./auth.repository');
jest.mock('../notifications/sms.service');
jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    authService = new AuthService();
    authRepository = new AuthRepository() as jest.Mocked<AuthRepository>;
    smsService = new SmsService() as jest.Mocked<SmsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should return user and tokens for valid credentials', async () => {
      const user = { id: '1', phone: '1234567890', passwordHash: 'hashed-password', salonId: '1' };
      authRepository.findUserByPhone.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginUser('1234567890', 'password', '1');

      expect(result.user).toEqual(user);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw an error for invalid credentials', async () => {
      authRepository.findUserByPhone.mockResolvedValue(null);

      await expect(authService.loginUser('1234567890', 'password', '1')).rejects.toThrow(
        createHttpError(401, 'Invalid credentials')
      );
    });

    it('should throw an error for incorrect password', async () => {
        const user = { id: '1', phone: '1234567890', passwordHash: 'hashed-password', salonId: '1' };
        authRepository.findUserByPhone.mockResolvedValue(user);
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(authService.loginUser('1234567890', 'wrong-password', '1')).rejects.toThrow(
          createHttpError(401, 'Invalid credentials')
        );
      });
  });

  describe('loginCustomer', () => {
    it('should return customer and tokens', async () => {
      const customer = { id: '1', phone: '1234567890' };
      authRepository.findCustomerByPhone.mockResolvedValue(customer);

      const result = await authService.loginCustomer('1234567890');

      expect(result.customer).toEqual(customer);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should create a new customer if not found', async () => {
        authRepository.findCustomerByPhone.mockResolvedValue(null);
        authRepository.createCustomer.mockResolvedValue({ id: '1', phone: '1234567890' });

        const result = await authService.loginCustomer('1234567890');

        expect(result.customer).toHaveProperty('id');
        expect(result.customer.phone).toBe('1234567890');
        expect(result.tokens).toHaveProperty('accessToken');
        expect(result.tokens).toHaveProperty('refreshToken');
      });
  });

  describe('requestUserOtp', () => {
    it('should send an OTP to an existing user', async () => {
      authRepository.findUserByPhone.mockResolvedValue({ id: '1', phone: '1234567890' });

      const result = await authService.requestUserOtp('1234567890');

      expect(result.message).toContain('OTP sent');
      expect(smsService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw an error if user does not exist', async () => {
        authRepository.findUserByPhone.mockResolvedValue(null);

      await expect(authService.requestUserOtp('1234567890')).rejects.toThrow(
        createHttpError(404, 'No user found with this phone number.')
      );
    });
  });

  describe('verifyUserOtp', () => {
    it('should return salons for a valid OTP', async () => {
        const otp = { id: '1', codeHash: 'hashed-code', consumedAt: null };
        authRepository.findOtp.mockResolvedValue(otp);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        authRepository.findUsersByPhone.mockResolvedValue([
          { id: '1', phone: '1234567890', salon: { id: '1', name: 'Salon 1' } },
        ]);

        const result = await authService.verifyUserOtp('1234567890', '123456');

        expect(result.salons).toEqual([{ id: '1', name: 'Salon 1' }]);
        expect(authRepository.consumeOtp).toHaveBeenCalledWith(otp.id);
      });

    it('should throw an error for an invalid OTP', async () => {
        authRepository.findOtp.mockResolvedValue(null);

      await expect(authService.verifyUserOtp('1234567890', '123456')).rejects.toThrow(
        createHttpError(401, 'Invalid or expired OTP.')
      );
    });
  });

  describe('loginUserWithOtp', () => {
    it('should return user and tokens for a valid OTP', async () => {
        authRepository.findRecentVerifiedOtp.mockResolvedValue({ id: '1' });
        const user = { id: '1', phone: '1234567890', salonId: '1' };
        authRepository.findUserByPhone.mockResolvedValue(user);

        const result = await authService.loginUserWithOtp('1234567890', '1');

        expect(result.user).toEqual(user);
        expect(result.tokens).toHaveProperty('accessToken');
        expect(result.tokens).toHaveProperty('refreshToken');
      });

    it('should throw an error if no recent OTP verification is found', async () => {
        authRepository.findRecentVerifiedOtp.mockResolvedValue(null);

      await expect(authService.loginUserWithOtp('1234567890', '1')).rejects.toThrow(
        createHttpError(401, 'No recent OTP verification found. Please verify again.')
      );
    });
  });

  describe('refreshAuthToken', () => {
    it('should return a new access token for a valid refresh token', async () => {
      const session = { id: '1', actorId: '1', actorType: 'USER', revokedAt: null, expiresAt: new Date(Date.now() + 10000) };
      authRepository.findSessionByToken.mockResolvedValue(session);

      const result = await authService.refreshAuthToken('valid-token');

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw an error for an invalid refresh token', async () => {
      authRepository.findSessionByToken.mockResolvedValue(null);

      await expect(authService.refreshAuthToken('invalid-token')).rejects.toThrow(
        createHttpError(401, 'Session is invalid or has been revoked')
      );
    });
  });

  describe('logout', () => {
    it('should revoke the session', async () => {
      await authService.logout('session-id');

      expect(authRepository.revokeSession).toHaveBeenCalledWith('session-id');
    });
  });
});
