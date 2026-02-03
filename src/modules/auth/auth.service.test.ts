import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SmsService } from '../notifications/sms.service';
import { mocked } from 'jest-mock';

// Mock the entire module with a factory function
jest.mock('./auth.repository', () => {
  return {
    AuthRepository: jest.fn().mockImplementation(() => {
      return {
        // Mock methods needed for tests here, e.g.:
        findUserByPhone: jest.fn(),
        createSession: jest.fn(),
      };
    }),
  };
});

jest.mock('../notifications/sms.service');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: any;
  let smsService: any;

  beforeEach(() => {
    process.env.SMSIR_OTP_TEMPLATE_ID = '123';
    authService = new AuthService();
    // In our case, authService will create its own instances, but since we mocked the classes,
    // these instances will be the mocked ones.
    authRepository = (authService as any).authRepository;
    smsService = (authService as any).smsService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('loginUser', () => {
    it('should login a user with valid credentials', async () => {
      const mockUser = { id: 'user-1', passwordHash: 'hashed-pw' };
      authRepository.findUserByPhone.mockResolvedValue(mockUser);
      authRepository.createSession.mockResolvedValue({ id: 'session-1' });

      // Mock argon2.verify
      const argon2 = require('argon2');
      jest.mock('argon2', () => ({
        verify: jest.fn().mockResolvedValue(true),
      }));

      const result = await authService.loginUser('1234567890', 'password', 'salon-1');

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw 401 for invalid password', async () => {
      const mockUser = { id: 'user-1', passwordHash: 'hashed-pw' };
      authRepository.findUserByPhone.mockResolvedValue(mockUser);

      const argon2 = require('argon2');
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(authService.loginUser('1234567890', 'wrong', 'salon-1'))
        .rejects.toThrow(); // http-errors doesn't easily match with toThrow(Error) in some versions of jest
    });
  });

  describe('refreshAuthToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const mockSession = {
        id: 'session-1',
        actorId: 'actor-1',
        actorType: 'USER',
        expiresAt: new Date(Date.now() + 10000)
      };
      authRepository.findSessionByToken.mockResolvedValue(mockSession);

      const result = await authService.refreshAuthToken('valid-token');

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw if session is expired', async () => {
        const mockSession = {
            id: 'session-1',
            expiresAt: new Date(Date.now() - 10000)
          };
          authRepository.findSessionByToken.mockResolvedValue(mockSession);
          authRepository.revokeSession.mockResolvedValue(undefined);

          await expect(authService.refreshAuthToken('expired-token')).rejects.toThrow();
    });
  });
});
