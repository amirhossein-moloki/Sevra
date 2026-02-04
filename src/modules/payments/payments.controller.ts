import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { PaymentsService } from './payments.service';

const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const idempotencyKey = req.header('Idempotency-Key');

  const result = await PaymentsService.initiatePayment({
    salonId: salonId!,
    bookingId,
    idempotencyKey: idempotencyKey ?? null,
  });

  res.created(result);
});

export const PaymentsController = {
  initiatePayment,
};
