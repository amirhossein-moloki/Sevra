import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();

export enum AppEvents {
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELED = 'booking.canceled',
  BOOKING_COMPLETED = 'booking.completed',
  BOOKING_NOSHOW = 'booking.noshow',
  PAYMENT_SUCCESS = 'payment.success',
  REVIEW_CREATED = 'review.created',
}
