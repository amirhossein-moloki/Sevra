
import { NextFunction, Response } from 'express';
import { AppRequest } from '../../types/express';
import { bookingsService } from './bookings.service';
import httpStatus from 'http-status';

export const createBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const data = {
    ...req.body,
    salonId: req.tenant.salonId,
    createdByUserId: req.actor.id,
    requestId: req.id,
  };
  const booking = await bookingsService.createBooking(data);
  res.status(httpStatus.CREATED).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const createPublicBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const { salonSlug } = req.params;

  const booking = await bookingsService.createPublicBooking(
    salonSlug,
    req.body
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const getBookings = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const result = await bookingsService.getBookings(req.tenant.salonId, req.query, req.actor);
  res.status(httpStatus.OK).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
};

export const getBookingById = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.getBookingById(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const updateBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.updateBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.body,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const confirmBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.confirmBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const cancelBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.cancelBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor,
    req.body,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const completeBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.completeBooking(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};

export const markAsNoShow = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.markAsNoShow(
    req.params.bookingId,
    req.tenant.salonId,
    req.actor,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};
