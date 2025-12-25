import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { generateToken } from './auth.tokens';
import createHttpError from 'http-errors';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: any) {
    const { fullName, phone, password , salonId} = data;

    const existingUser = await prisma.user.findUnique({
      where: { salonId_phone: { salonId, phone } },
    });

    if (existingUser) {
      throw createHttpError(409, 'User with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        passwordHash,
        salonId,
        role: UserRole.STAFF,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(data: any) {
    const { phone, password, salonId } = data;

    const user = await prisma.user.findUnique({
      where: { salonId_phone: { salonId, phone } },
    });

    if (!user || !user.passwordHash) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const token = generateToken({ userId: user.id, salonId: user.salonId, role: user.role });

    // eslint-disable--next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
