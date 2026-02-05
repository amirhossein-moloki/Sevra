
import { Response } from 'express';
import { SessionActorType, UserRole } from '@prisma/client';
import { AppRequest } from '../../types/express';
import { bookingsService } from './bookings.service';

export const createBooking = async (
  req: AppRequest,
  res: Response
) => {
  const data = {
    ...req.body,
    salonId: req.tenant.salonId,
    createdByUserId: req.actor.id,
    requestId: req.id,
  };
  const booking = await bookingsService.createBooking(data);
  res.created(booking);
};

export const createPublicBooking = async (
  req: AppRequest,
  res: Response
) => {
  const { salonSlug } = req.params;

  const booking = await bookingsService.createPublicBooking(
    salonSlug,
    req.body
  );

  res.created(booking);
};

export const getBookings = async (
  req: AppRequest,
  res: Response
) => {
  const result = await bookingsService.getBookings(
    req.tenant.salonId,
    req.query,
    req.actor as { id: string; role: UserRole }
  );
  res.ok(result.data, { pagination: result.meta });
};

export const getBookingById = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.getBookingById(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor as { id: string; role: UserRole }
  );
  res.ok(booking);
};

export const updateBooking = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.updateBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.body,
    req.actor as { id: string; actorType: SessionActorType },
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.ok(booking);
};

export const confirmBooking = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.confirmBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor as { id: string; role: UserRole }
  );
  res.ok(booking);
};

export const cancelBooking = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.cancelBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor as { id: string; role: UserRole; actorType: SessionActorType },
    req.body,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.ok(booking);
};

export const completeBooking = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.completeBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor as { id: string; role: UserRole; actorType: SessionActorType },
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.ok(booking);
};

export const markAsNoShow = async (
  req: AppRequest,
  res: Response
) => {
  const booking = await bookingsService.markAsNoShow(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor as { id: string; role: UserRole; actorType: SessionActorType },
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.ok(booking);
};
