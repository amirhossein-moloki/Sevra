import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { PaymentsService } from './payments.service';
import httpStatus from 'http-status';

const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const idempotencyKey = req.header('Idempotency-Key');

  const result = await PaymentsService.initiatePayment({
    salonId: salonId!,
    bookingId,
    idempotencyKey: idempotencyKey ?? null,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    data: result,
  });
});

export const PaymentsController = {
  initiatePayment,
};
