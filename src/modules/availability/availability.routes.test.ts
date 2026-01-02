import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/prisma';

describe('GET /public/salons/:salonSlug/availability/slots', () => {
  let salon: any;
  let service: any;
  let staff: any;
  let testDate: Date; // A fixed Monday for testing

  beforeAll(async () => {
    // Find the next Monday to ensure the test is stable
    const today = new Date();
    testDate = new Date(today);
    testDate.setHours(0, 0, 0, 0); // Start of the day
    // In JS, Sunday is 0, Monday is 1. Prisma schema uses Int. This is consistent.
    while (testDate.getDay() !== 1) {
        testDate.setDate(testDate.getDate() + 1);
    }

    // 1. Create Salon
    salon = await prisma.salon.create({
      data: {
        name: 'Test Salon for Availability',
        slug: `test-salon-avail-${Date.now()}`,
      },
    });

    // 2. Create Staff Member
    staff = await prisma.user.create({
      data: {
        salonId: salon.id,
        fullName: 'Available Staff',
        phone: `+2${Date.now()}`,
        role: 'STAFF',
      },
    });

    // 3. Create Service and link it to the staff
    service = await prisma.service.create({
      data: {
        salonId: salon.id,
        name: 'Availability Test Service',
        durationMinutes: 60,
        price: 100,
        currency: 'USD',
        userServices: {
          create: {
            userId: staff.id,
          },
        },
      },
    });

    // 4. Create a Shift for the staff on Monday (dayOfWeek = 1)
    await prisma.shift.create({
      data: {
        userId: staff.id,
        salonId: salon.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00:00',
        endTime: '17:00:00',
        isActive: true,
      },
    });

    // 5. Create a Booking that blocks a part of the shift (11:00 to 12:00)
    const customer = await prisma.customerAccount.create({ data: { phone: `+3${Date.now()}` } });
    const customerProfile = await prisma.salonCustomerProfile.create({
      data: { salonId: salon.id, customerAccountId: customer.id },
    });
    const creator = await prisma.user.create({
      data: { salonId: salon.id, fullName: 'Booking Creator', phone: `+4${Date.now()}`, role: 'MANAGER' }
    });

    await prisma.booking.create({
        data: {
            salonId: salon.id,
            staffId: staff.id,
            serviceId: service.id,
            customerProfileId: customerProfile.id,
            customerAccountId: customer.id,
            createdByUserId: creator.id,
            startAt: new Date(new Date(testDate).setHours(11, 0, 0, 0)),
            endAt: new Date(new Date(testDate).setHours(12, 0, 0, 0)),
            serviceNameSnapshot: service.name,
            serviceDurationSnapshot: service.durationMinutes,
            servicePriceSnapshot: service.price,
            currencySnapshot: service.currency,
            amountDueSnapshot: service.price,
        }
    });
  });

  afterAll(async () => {
    // Clean up in reverse order of creation
    await prisma.$transaction([
        prisma.booking.deleteMany({ where: { salonId: salon.id } }),
        prisma.salonCustomerProfile.deleteMany({ where: { salonId: salon.id } }),
        prisma.userService.deleteMany({ where: { serviceId: service.id } }),
        prisma.shift.deleteMany({ where: { salonId: salon.id } }),
    ]);

    await prisma.service.delete({ where: { id: service.id } });
    await prisma.user.deleteMany({ where: { salonId: salon.id } });
    await prisma.customerAccount.deleteMany({});
    await prisma.salon.delete({ where: { id: salon.id } });
    await prisma.$disconnect();
  });

  it('should return available slots, excluding the booked slot and overlapping slots', async () => {
    const startDate = new Date(testDate);
    const endDate = new Date(new Date(testDate).setHours(23, 59, 59, 999));

    const response = await request(app)
      .get(`/api/v1/public/salons/${salon.slug}/availability/slots`)
      .query({
        serviceId: service.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const returnedTimes = response.body.map((s: any) => new Date(s.time).getTime());

    const ten = new Date(new Date(testDate).setHours(10, 0, 0, 0)).getTime();
    const tenFifteen = new Date(new Date(testDate).setHours(10, 15, 0, 0)).getTime(); // Overlaps
    const eleven = new Date(new Date(testDate).setHours(11, 0, 0, 0)).getTime(); // Booked
    const twelve = new Date(new Date(testDate).setHours(12, 0, 0, 0)).getTime();

    expect(returnedTimes).toContain(ten);
    expect(returnedTimes).not.toContain(tenFifteen);
    expect(returnedTimes).not.toContain(eleven);
    expect(returnedTimes).toContain(twelve);

    // Also check the staff info in the response
    expect(response.body[0].staff).toEqual({
        id: staff.id,
        fullName: staff.fullName,
    });
  });
});
