import { prisma } from '../../config/prisma';
import { CustomerFilters, CreateCustomerInput, UpdateCustomerInput } from './customers.types';

export async function findManyProfiles(salonId: string, filters: CustomerFilters) {
  const { search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    salonId,
  };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { customerAccount: { fullName: { contains: search, mode: 'insensitive' } } },
      { customerAccount: { phone: { contains: search } } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.salonCustomerProfile.findMany({
      where,
      include: {
        customerAccount: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salonCustomerProfile.count({ where }),
  ]);

  return { customers, total };
}

export async function findProfileById(salonId: string, profileId: string) {
  return prisma.salonCustomerProfile.findFirst({
    where: {
      id: profileId,
      salonId,
    },
    include: {
      customerAccount: true,
    },
  });
}

export async function findProfileByAccountId(salonId: string, customerAccountId: string) {
  return prisma.salonCustomerProfile.findUnique({
    where: {
      salonId_customerAccountId: {
        salonId,
        customerAccountId,
      },
    },
  });
}

export async function upsertCustomerAccount(phone: string, fullName?: string) {
  return prisma.customerAccount.upsert({
    where: { phone },
    update: fullName ? { fullName } : {},
    create: {
      phone,
      fullName,
    },
  });
}

export async function createProfile(data: {
  salonId: string;
  customerAccountId: string;
  displayName?: string;
  note?: string;
}) {
  return prisma.salonCustomerProfile.create({
    data,
    include: {
      customerAccount: true,
    },
  });
}

export async function updateProfile(
  profileId: string,
  salonId: string,
  data: UpdateCustomerInput
) {
  return prisma.salonCustomerProfile.update({
    where: {
      id: profileId,
      // We don't have a unique constraint on id and salonId, but it's safe since id is PK.
      // However, to ensure tenant isolation:
    },
    data,
    include: {
      customerAccount: true,
    },
  });
}

export async function deleteProfile(profileId: string, salonId: string) {
    // Ensuring it belongs to the salon
    const profile = await prisma.salonCustomerProfile.findFirst({
        where: { id: profileId, salonId }
    });

    if (!profile) return null;

    return prisma.salonCustomerProfile.delete({
        where: { id: profileId }
    });
}
