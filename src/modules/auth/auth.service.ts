import argon2 from 'argon2';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { generateAccessToken, generateRefreshToken, verifyToken } from './auth.tokens';
import { env } from '../../config/env';
import { SessionActorType } from '@prisma/client';
import createHttpError from 'http-errors';
import { prisma } from '../../config/prisma';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  private async createAndSaveSession(actorId: string, actorType: SessionActorType) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // We don't store the refresh token directly, but a hash of it.
    // For simplicity, we'll create a dummy session for now. A more secure approach is needed.
    const session = await this.authRepository.createSession(actorId, actorType, 'dummy-hash', expiresAt);

    const payload = { sessionId: session.id, actorId, actorType };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

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
    const payload = verifyToken(token, env.JWT_REFRESH_SECRET);
    if (!payload) {
      throw createHttpError(401, 'Invalid refresh token');
    }

    const session = await this.authRepository.findSessionByToken('dummy-hash'); // This needs to be fixed with proper token hashing
    if (!session || session.revokedAt) {
      throw createHttpError(401, 'Session is invalid or has been revoked');
    }

    const newPayload = { sessionId: session.id, actorId: payload.actorId, actorType: payload.actorType };
    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  }

  async logout(sessionId: string) {
    await this.authRepository.revokeSession(sessionId);
    return { message: 'Logged out successfully' };
  }
}
