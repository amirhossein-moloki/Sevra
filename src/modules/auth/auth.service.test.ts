import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SmsService } from '../notifications/sms.service';
import { mocked } from 'jest-mock';

jest.mock('./auth.repository');
jest.mock('../notifications/sms.service');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    authRepository = mocked(new AuthRepository());
    smsService = mocked(new SmsService());
    authService = new AuthService();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
