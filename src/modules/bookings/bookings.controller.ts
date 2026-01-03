
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
    salonId: req.salonId,
    createdByUserId: req.user.id,
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
  const data = {
    ...req.body,
    salonSlug: req.params.salonSlug,
  };
  const booking = await bookingsService.createPublicBooking(data);
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
  const result = await bookingsService.getBookings(req.salonId, req.query);
  res.status(httpStatus.OK).json({
    success: true,
    ...result,
  });
};

export const getBookingById = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  const booking = await bookingsService.getBookingById(
    req.params.bookingId,
    req.salonId
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
    req.salonId,
    req.body
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
    req.salonId
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
    req.salonId,
    req.user.id,
    req.body
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
    req.salonId
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
    req.salonId
  );
  res.status(httpStatus.OK).json({
    success: true,
    data: booking,
    meta: null,
  });
};
