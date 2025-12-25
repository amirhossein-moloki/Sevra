import argon2 from 'argon2';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { generateAccessToken } from './auth.tokens';
import { SessionActorType } from '@prisma/client';
import createHttpError from 'http-errors';
import { prisma } from '../../config/prisma';

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
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
