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
  let authRepository: jest.Mocked<AuthRepository>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    // Now, AuthRepository is the mocked constructor
    authRepository = new (mocked(AuthRepository))() as jest.Mocked<AuthRepository>;
    smsService = new (mocked(SmsService))() as jest.Mocked<SmsService>;
    // Pass the mocked instances to the service constructor if needed
    authService = new AuthService();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
