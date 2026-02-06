import { Response } from 'express';
import { CustomerPanelService } from './customer-panel.service';
import { AppRequest } from '../../types/express';

export const getMe = async (req: AppRequest, res: Response) => {
  const customerAccountId = req.actor.id;
  const profile = await CustomerPanelService.getProfile(customerAccountId);
  res.ok(profile);
};

export const getMyBookings = async (req: AppRequest, res: Response) => {
  const customerAccountId = req.actor.id;
  const result = await CustomerPanelService.getBookings(customerAccountId, req.query);
  res.ok(result.data, { pagination: result.meta });
};

export const getMyBookingDetails = async (req: AppRequest, res: Response) => {
  const customerAccountId = req.actor.id;
  const { bookingId } = req.params;
  const booking = await CustomerPanelService.getBookingDetails(bookingId, customerAccountId);
  res.ok(booking);
};

export const cancelMyBooking = async (req: AppRequest, res: Response) => {
  const customerAccountId = req.actor.id;
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await CustomerPanelService.cancelBooking(
    bookingId,
    customerAccountId,
    reason,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );

  res.ok(booking);
};

export const submitMyReview = async (req: AppRequest, res: Response) => {
  const customerAccountId = req.actor.id;
  const { bookingId } = req.params;

  const review = await CustomerPanelService.submitReview(
    bookingId,
    customerAccountId,
    req.body
  );

  res.created(review);
};
