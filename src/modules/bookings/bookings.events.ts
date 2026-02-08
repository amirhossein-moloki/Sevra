import { AppEvents, eventEmitter } from '../../common/events/event-emitter';
import { AnalyticsRepo } from '../analytics/analytics.repo';
import { SmsService } from '../notifications/sms.service';
import { Booking, Salon, Settings, BookingStatus } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { env } from '../../config/env';

type SalonWithSettings = Salon & { settings?: Settings | null };

const sendBookingStatusSms = async (booking: Booking, salon: SalonWithSettings, customerPhone: string, customerName: string) => {
  let templateId: number | undefined;

  if (booking.status === BookingStatus.CONFIRMED) {
    templateId = env.SMSIR_BOOKING_CONFIRMED_TEMPLATE_ID;
  } else if (booking.status === BookingStatus.PENDING) {
    templateId = env.SMSIR_BOOKING_PENDING_TEMPLATE_ID;
  } else if (booking.status === BookingStatus.CANCELED) {
    templateId = env.SMSIR_BOOKING_CANCELED_TEMPLATE_ID;
  }

  if (!templateId) return;

  const timeZone = salon.settings?.timeZone || 'UTC';
  const dateStr = formatInTimeZone(booking.startAt, timeZone, 'yyyy/MM/dd');
  const timeStr = formatInTimeZone(booking.startAt, timeZone, 'HH:mm');

  const parameters = [
    { name: 'CUSTOMER_NAME', value: customerName },
    { name: 'SERVICE_NAME', value: booking.serviceNameSnapshot },
    { name: 'DATE', value: dateStr },
    { name: 'TIME', value: timeStr },
    { name: 'SALON_NAME', value: salon.name },
  ];

  try {
    await SmsService.sendTemplateSms(customerPhone, templateId, parameters);
  } catch (error) {
    console.error('Failed to send booking SMS:', error);
  }
};

export const initBookingEvents = () => {
  eventEmitter.on(AppEvents.BOOKING_CREATED, async ({ booking, salon, customerAccount }) => {
    AnalyticsRepo.syncAllStatsForBooking(booking.id).catch(console.error);
    await sendBookingStatusSms(booking, salon, customerAccount.phone, customerAccount.fullName || '');
  });

  eventEmitter.on(AppEvents.BOOKING_UPDATED, async ({ updatedBooking, oldBooking }) => {
    AnalyticsRepo.syncSpecificStats(
      oldBooking.salonId,
      oldBooking.startAt,
      oldBooking.staffId,
      oldBooking.serviceId
    ).catch(console.error);

    AnalyticsRepo.syncSpecificStats(
      updatedBooking.salonId,
      updatedBooking.startAt,
      updatedBooking.staffId,
      updatedBooking.serviceId
    ).catch(console.error);
  });

  eventEmitter.on(AppEvents.BOOKING_CONFIRMED, async ({ booking, salon, customerAccount }) => {
    AnalyticsRepo.syncAllStatsForBooking(booking.id).catch(console.error);
    await sendBookingStatusSms(booking, salon, customerAccount.phone, customerAccount.fullName || '');
  });

  eventEmitter.on(AppEvents.BOOKING_CANCELED, async ({ booking, salon, customerAccount }) => {
    AnalyticsRepo.syncAllStatsForBooking(booking.id).catch(console.error);
    await sendBookingStatusSms(booking, salon, customerAccount.phone, customerAccount.fullName || '');
  });

  eventEmitter.on(AppEvents.BOOKING_COMPLETED, async ({ booking }) => {
    AnalyticsRepo.syncAllStatsForBooking(booking.id).catch(console.error);
  });

  eventEmitter.on(AppEvents.BOOKING_NOSHOW, async ({ booking }) => {
    AnalyticsRepo.syncAllStatsForBooking(booking.id).catch(console.error);
  });
};
