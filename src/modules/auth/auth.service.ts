import argon2 from 'argon2';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { generateAccessToken } from './auth.tokens';
import { OtpPurpose, SessionActorType } from '@prisma/client';
import createHttpError from 'http-errors';
import { prisma } from '../../config/prisma';
import { SmsService } from '../notifications/sms.service';

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// OTP settings
const OTP_EXPIRATION_MINUTES = 2;
const OTP_LENGTH = 6;
const OTP_POST_VERIFICATION_WINDOW_MINUTES = 5; // How long a user has to login after verifying OTP

const generateNumericOtp = (length: number): string => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

export class AuthService {
  private authRepository: AuthRepository;
  private smsService: SmsService;
  private otpTemplateId: number;

  constructor() {
    this.authRepository = new AuthRepository();
    this.smsService = new SmsService();

    const templateId = process.env.SMSIR_OTP_TEMPLATE_ID;
    if (!templateId) {
        throw new Error('SMSIR_OTP_TEMPLATE_ID must be set in the environment variables.');
    }
    this.otpTemplateId = parseInt(templateId, 10);
  }

  private async createAndSaveSession(actorId: string, actorType: SessionActorType) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 1. Generate a secure, random refresh token.
    const refreshToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the refresh token for database storage.
    const tokenHash = hashToken(refreshToken);

    // 3. Create the session with the hashed token.
    const session = await this.authRepository.createSession(actorId, actorType, tokenHash, expiresAt);

    // 4. Create the access token.
    const payload = { sessionId: session.id, actorId, actorType };
    const accessToken = generateAccessToken(payload);

    // 5. Return the raw refresh token to the client. It's sent only once.
    return { accessToken, refreshToken };
  }

  async loginUser(phone: string, password: string, salonId: string) {
    const user = await this.authRepository.findUserByPhone(phone, salonId);
    if (!user || !user.passwordHash) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.createAndSaveSession(user.id, 'USER');

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async requestUserOtp(phone: string) {
    const userExists = await prisma.user.findFirst({ where: { phone } });
    if (!userExists) {
        throw createHttpError(404, 'No user found with this phone number.');
    }

    const code = generateNumericOtp(OTP_LENGTH);
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await prisma.phoneOtp.create({
        data: {
            phone,
            purpose: OtpPurpose.LOGIN,
            codeHash,
            expiresAt,
        }
    });

    await this.smsService.sendVerificationCode(phone, this.otpTemplateId, [{ name: 'CODE', value: code }]);

    return { message: `OTP sent to ${phone}. It will expire in ${OTP_EXPIRATION_MINUTES} minutes.` };
  }

  async verifyUserOtp(phone: string, code: string) {
    const otp = await prisma.phoneOtp.findFirst({
        where: {
            phone,
            purpose: OtpPurpose.LOGIN,
            consumedAt: null,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
        throw createHttpError(401, 'Invalid or expired OTP.');
    }

    const isCodeValid = await argon2.verify(otp.codeHash, code);

    if (!isCodeValid) {
        // Optional: Increment an attempt counter to prevent brute-force attacks
        throw createHttpError(401, 'Invalid or expired OTP.');
    }

    await prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
    });

    const users = await prisma.user.findMany({
        where: { phone },
        include: { salon: true },
    });

    const salons = users.map(user => ({
        id: user.salon.id,
        name: user.salon.name,
    }));

    return { salons };
  }

  async loginUserWithOtp(phone: string, salonId: string) {
    const verificationWindow = new Date(Date.now() - OTP_POST_VERIFICATION_WINDOW_MINUTES * 60 * 1000);

    const recentVerifiedOtp = await prisma.phoneOtp.findFirst({
        where: {
            phone,
            purpose: OtpPurpose.LOGIN,
            consumedAt: { gte: verificationWindow },
        },
        orderBy: {
            consumedAt: 'desc'
        }
    });

    if (!recentVerifiedOtp) {
        throw createHttpError(401, 'No recent OTP verification found. Please verify again.');
    }

    const user = await this.authRepository.findUserByPhone(phone, salonId);
    if (!user) {
      throw createHttpError(401, 'Invalid credentials for the selected salon.');
    }

    const { accessToken, refreshToken } = await this.createAndSaveSession(user.id, 'USER');

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async loginCustomer(phone: string) {
    let customer = await this.authRepository.findCustomerByPhone(phone);

    // For now, we'll create a customer if they don't exist.
    // In a real scenario, this would be part of a signup/OTP flow.
    if (!customer) {
        customer = await prisma.customerAccount.create({ data: { phone }});
    }

    const { accessToken, refreshToken } = await this.createAndSaveSession(customer.id, 'CUSTOMER');

    return {
      customer,
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshAuthToken(token: string) {
    // The incoming token is the raw refresh token string.
    // 1. Hash the incoming token to find it in the database.
    const tokenHash = hashToken(token);

    // 2. Find the session.
    const session = await this.authRepository.findSessionByToken(tokenHash);
    if (!session || session.revokedAt) {
      throw createHttpError(401, 'Session is invalid or has been revoked');
    }

    // 3. Check for expiration.
    if (new Date() > session.expiresAt) {
      await this.authRepository.revokeSession(session.id);
      throw createHttpError(401, 'Refresh token has expired');
    }

    // 4. Create and return a new access token.
    const newPayload = { sessionId: session.id, actorId: session.actorId, actorType: session.actorType };
    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  }

  async logout(sessionId: string) {
    await this.authRepository.revokeSession(sessionId);
    return { message: 'Logged out successfully' };
  }
}
