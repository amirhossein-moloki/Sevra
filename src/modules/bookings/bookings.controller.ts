
import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { AppRequest } from '../../types/express.d';
import { CreateBookingBody } from './bookings.validators';
import * as bookingsService from './bookings.service';

export const createBooking = async (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { salonId, actorId } = req; // actorId is the createdByUserId
    const bookingData = req.body as CreateBookingBody;
    const newBooking = await bookingsService.createBooking(salonId, actorId, bookingData);
    res.status(httpStatus.CREATED).json({
      message: 'Booking created successfully',
      data: newBooking,
    });
  } catch (error) {
    next(error);
  }
};
