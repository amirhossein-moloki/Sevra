import createHttpError from 'http-errors';
import { CustomerPanelRepo } from './customer-panel.repo';
import { GetCustomerBookingsQuery, CustomerSubmitReviewInput } from './customer-panel.validators';
import { BookingStatus, Prisma, SessionActorType } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { AnalyticsRepo } from '../analytics/analytics.repo';
import * as reviewsRepo from '../reviews/reviews.repo';

export const CustomerPanelService = {
  async getProfile(customerAccountId: string) {
    const account = await CustomerPanelRepo.findCustomerAccountById(customerAccountId);
    if (!account) {
      throw createHttpError(404, 'Customer account not found');
    }
    return account;
  },

  async getBookings(customerAccountId: string, query: GetCustomerBookingsQuery) {
    const { page = 1, pageSize = 10, status, salonId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BookingWhereInput = {
      customerAccountId,
      status,
      salonId,
    };

    const [bookings, totalItems] = await Promise.all([
      CustomerPanelRepo.findManyBookings(where, skip, pageSize),
      CustomerPanelRepo.countBookings(where),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  },

  async getBookingDetails(bookingId: string, customerAccountId: string) {
    const booking = await CustomerPanelRepo.findBookingById(bookingId, customerAccountId);
    if (!booking) {
      throw createHttpError(404, 'Booking not found');
    }
    return booking;
  },

  async cancelBooking(
    bookingId: string,
    customerAccountId: string,
    reason?: string,
    context?: { ip?: string; userAgent?: string }
  ) {
    const booking = await CustomerPanelRepo.findBookingById(bookingId, customerAccountId);
    if (!booking) {
      throw createHttpError(404, 'Booking not found');
    }

    if (!([BookingStatus.PENDING, BookingStatus.CONFIRMED] as BookingStatus[]).includes(booking.status)) {
      throw createHttpError(400, 'Booking cannot be canceled in its current state');
    }

    const updatedBooking = await CustomerPanelRepo.updateBooking(bookingId, {
      status: BookingStatus.CANCELED,
      canceledAt: new Date(),
      cancelReason: reason || 'Canceled by customer',
      // We don't have a canceledByUserId that is a customer in the schema for now,
      // but we can record it in audit log.
    });

    await auditService.recordLog({
      salonId: booking.salonId,
      actorId: customerAccountId,
      actorType: SessionActorType.CUSTOMER,
      action: 'BOOKING_CANCEL',
      entity: 'Booking',
      entityId: bookingId,
      oldData: booking,
      newData: updatedBooking,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    AnalyticsRepo.syncAllStatsForBooking(bookingId).catch(console.error);

    return updatedBooking;
  },

  async submitReview(
    bookingId: string,
    customerAccountId: string,
    input: CustomerSubmitReviewInput
  ) {
    const booking = await CustomerPanelRepo.findBookingById(bookingId, customerAccountId);
    if (!booking) {
      throw createHttpError(404, 'Booking not found');
    }

    if (booking.status !== BookingStatus.DONE) {
      throw createHttpError(400, 'Only completed bookings can be reviewed');
    }

    // Check if review already exists for this target
    // The Review model has a unique constraint on [bookingId, target, serviceId]

    try {
      const review = await reviewsRepo.createReview(booking.salonId, customerAccountId, {
        bookingId,
        target: input.target,
        rating: input.rating,
        serviceId: input.serviceId,
        comment: input.comment,
      });

      AnalyticsRepo.syncAllStatsForReview(review.id).catch(console.error);

        return review;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw createHttpError(409, 'Review already exists for this booking/target');
        }
        throw error;
    }
  },
};
