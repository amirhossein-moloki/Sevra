import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import { CustomerPanelRepo } from './customer-panel.repo';
import { GetCustomerBookingsQuery, CustomerSubmitReviewInput } from './customer-panel.validators';
import { BookingStatus, Prisma, SessionActorType } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { WalletService } from '../wallet/wallet.service';
import { AnalyticsRepo } from '../analytics/analytics.repo';
import * as reviewsRepo from '../reviews/reviews.repo';

export const CustomerPanelService = {
  async getProfile(customerAccountId: string) {
    const account = await CustomerPanelRepo.findCustomerAccountById(customerAccountId);
    if (!account) {
      throw new AppError('Customer account not found', httpStatus.NOT_FOUND);
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
      throw new AppError('Booking not found', httpStatus.NOT_FOUND);
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
      throw new AppError('Booking not found', httpStatus.NOT_FOUND);
    }

    if (!([BookingStatus.PENDING, BookingStatus.CONFIRMED] as BookingStatus[]).includes(booking.status)) {
      throw new AppError('Booking cannot be canceled in its current state', httpStatus.BAD_REQUEST);
    }

    const updatedBooking = await CustomerPanelRepo.transaction(async (tx) => {
      const result = await CustomerPanelRepo.updateBooking(bookingId, {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
        cancelReason: reason || 'Canceled by customer',
      }, tx);

      // Trigger refund if there are successful payments
      await WalletService.refundBookingToWallet(bookingId, tx);

      return result;
    });

    await auditService.log(
      booking.salonId,
      { id: customerAccountId, actorType: SessionActorType.CUSTOMER },
      'BOOKING_CANCEL',
      { name: 'Booking', id: bookingId },
      { old: booking, new: updatedBooking },
      context
    );

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
      throw new AppError('Booking not found', httpStatus.NOT_FOUND);
    }

    if (booking.status !== BookingStatus.DONE) {
      throw new AppError('Only completed bookings can be reviewed', httpStatus.BAD_REQUEST);
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
            throw new AppError('Review already exists for this booking/target', httpStatus.CONFLICT);
        }
        throw error;
    }
  },
};
