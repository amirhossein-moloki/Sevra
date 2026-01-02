-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'RECEPTIONIST', 'STAFF');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DONE', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'VOID');

-- CreateEnum
CREATE TYPE "BookingPaymentState" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'OVERPAID');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('HOME', 'ABOUT', 'SERVICES', 'GALLERY', 'TEAM', 'CONTACT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PageSectionType" AS ENUM ('HERO', 'RICH_TEXT', 'HIGHLIGHTS', 'SERVICES_GRID', 'STAFF_GRID', 'GALLERY_GRID', 'TESTIMONIALS', 'CONTACT_CARD', 'MAP', 'FAQ', 'CTA');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('COVER', 'GALLERY', 'BEFORE_AFTER', 'LOGO');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'WEBSITE', 'PHONE', 'GOOGLE_MAP');

-- CreateEnum
CREATE TYPE "ReviewTarget" AS ENUM ('SALON', 'SERVICE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "RobotsIndex" AS ENUM ('INDEX', 'NOINDEX');

-- CreateEnum
CREATE TYPE "RobotsFollow" AS ENUM ('FOLLOW', 'NOFOLLOW');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'ACCRUED', 'CHARGED', 'WAIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommissionPaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "CommissionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SessionActorType" AS ENUM ('USER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'SIGNUP');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateTable
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "preventOverlaps" BOOLEAN NOT NULL DEFAULT true,
    "timeZone" TEXT,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT false,
    "onlineBookingAutoConfirm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "actorType" "SessionActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "channel" "OtpChannel" NOT NULL DEFAULT 'SMS',
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "userAgent" TEXT,
    "targetActorType" "SessionActorType",
    "targetActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonCustomerProfile" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonCustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserService" (
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "UserService_pkey" PRIMARY KEY ("userId","serviceId")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "serviceDurationSnapshot" INTEGER NOT NULL,
    "servicePriceSnapshot" INTEGER NOT NULL,
    "currencySnapshot" TEXT NOT NULL,
    "amountDueSnapshot" INTEGER NOT NULL,
    "paymentState" "BookingPaymentState" NOT NULL DEFAULT 'UNPAID',
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" "BookingSource" NOT NULL DEFAULT 'IN_PERSON',
    "note" TEXT,
    "canceledAt" TIMESTAMPTZ(6),
    "cancelReason" TEXT,
    "canceledByUserId" TEXT,
    "completedAt" TIMESTAMPTZ(6),
    "noShowAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMPTZ(6),
    "referenceCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "target" "ReviewTarget" NOT NULL,
    "serviceId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonCommissionPolicy" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL DEFAULT 'PERCENT',
    "percentBps" INTEGER,
    "fixedAmount" INTEGER,
    "currency" TEXT,
    "applyToOnlineOnly" BOOLEAN NOT NULL DEFAULT true,
    "minimumFeeAmount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonCommissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCommission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "baseAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL,
    "percentBps" INTEGER,
    "fixedAmount" INTEGER,
    "commissionAmount" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMPTZ(6),
    "chargedAt" TIMESTAMPTZ(6),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPayment" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "CommissionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "CommissionPaymentMethod",
    "paidAt" TIMESTAMPTZ(6),
    "referenceCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSiteSettings" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "defaultSeoTitle" TEXT,
    "defaultSeoDescription" TEXT,
    "defaultOgImageUrl" TEXT,
    "googleSiteVerification" TEXT,
    "analyticsTag" TEXT,
    "robotsIndex" "RobotsIndex" NOT NULL DEFAULT 'INDEX',
    "robotsFollow" "RobotsFollow" NOT NULL DEFAULT 'FOLLOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonSiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonPage" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PageType" NOT NULL DEFAULT 'CUSTOM',
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(6),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalPath" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "robotsIndex" "RobotsIndex" NOT NULL DEFAULT 'INDEX',
    "robotsFollow" "RobotsFollow" NOT NULL DEFAULT 'FOLLOW',
    "structuredDataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonPageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "PageSectionType" NOT NULL,
    "dataJson" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonPageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonMedia" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "purpose" "MediaPurpose" NOT NULL DEFAULT 'GALLERY',
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "altText" TEXT,
    "category" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonLink" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "type" "LinkType" NOT NULL,
    "label" TEXT,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonAddress" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "title" TEXT,
    "province" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSlugHistory" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonPageSlugHistory" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonPageSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

-- CreateIndex
CREATE INDEX "Salon_slug_idx" ON "Salon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_salonId_key" ON "Settings"("salonId");

-- CreateIndex
CREATE INDEX "User_salonId_role_idx" ON "User"("salonId", "role");

-- CreateIndex
CREATE INDEX "User_salonId_isActive_idx" ON "User"("salonId", "isActive");

-- CreateIndex
CREATE INDEX "User_salonId_isPublic_idx" ON "User"("salonId", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "User_salonId_phone_key" ON "User"("salonId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_actorType_actorId_expiresAt_idx" ON "Session"("actorType", "actorId", "expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_purpose_expiresAt_idx" ON "PhoneOtp"("phone", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_createdAt_idx" ON "PhoneOtp"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_consumedAt_idx" ON "PhoneOtp"("consumedAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_targetActorType_targetActorId_idx" ON "PhoneOtp"("targetActorType", "targetActorId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_phone_key" ON "CustomerAccount"("phone");

-- CreateIndex
CREATE INDEX "CustomerAccount_phone_idx" ON "CustomerAccount"("phone");

-- CreateIndex
CREATE INDEX "SalonCustomerProfile_salonId_displayName_idx" ON "SalonCustomerProfile"("salonId", "displayName");

-- CreateIndex
CREATE INDEX "SalonCustomerProfile_customerAccountId_idx" ON "SalonCustomerProfile"("customerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SalonCustomerProfile_salonId_customerAccountId_key" ON "SalonCustomerProfile"("salonId", "customerAccountId");

-- CreateIndex
CREATE INDEX "Service_salonId_isActive_idx" ON "Service"("salonId", "isActive");

-- CreateIndex
CREATE INDEX "Service_salonId_name_idx" ON "Service"("salonId", "name");

-- CreateIndex
CREATE INDEX "UserService_serviceId_idx" ON "UserService"("serviceId");

-- CreateIndex
CREATE INDEX "UserService_userId_idx" ON "UserService"("userId");

-- CreateIndex
CREATE INDEX "Shift_salonId_dayOfWeek_idx" ON "Shift"("salonId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_salonId_userId_dayOfWeek_key" ON "Shift"("salonId", "userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Booking_salonId_startAt_idx" ON "Booking"("salonId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_salonId_staffId_startAt_idx" ON "Booking"("salonId", "staffId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_salonId_status_startAt_idx" ON "Booking"("salonId", "status", "startAt");

-- CreateIndex
CREATE INDEX "Booking_customerAccountId_startAt_idx" ON "Booking"("customerAccountId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_customerProfileId_startAt_idx" ON "Booking"("customerProfileId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_salonId_paymentState_startAt_idx" ON "Booking"("salonId", "paymentState", "startAt");

-- CreateIndex
CREATE INDEX "Payment_bookingId_paidAt_idx" ON "Payment"("bookingId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");

-- CreateIndex
CREATE INDEX "Review_salonId_status_createdAt_idx" ON "Review"("salonId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_serviceId_status_createdAt_idx" ON "Review"("serviceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_customerAccountId_createdAt_idx" ON "Review"("customerAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_target_serviceId_key" ON "Review"("bookingId", "target", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SalonCommissionPolicy_salonId_key" ON "SalonCommissionPolicy"("salonId");

-- CreateIndex
CREATE INDEX "SalonCommissionPolicy_salonId_isActive_idx" ON "SalonCommissionPolicy"("salonId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BookingCommission_bookingId_key" ON "BookingCommission"("bookingId");

-- CreateIndex
CREATE INDEX "BookingCommission_salonId_status_createdAt_idx" ON "BookingCommission"("salonId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingCommission_chargedAt_idx" ON "BookingCommission"("chargedAt");

-- CreateIndex
CREATE INDEX "CommissionPayment_commissionId_paidAt_idx" ON "CommissionPayment"("commissionId", "paidAt");

-- CreateIndex
CREATE INDEX "CommissionPayment_status_paidAt_idx" ON "CommissionPayment"("status", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalonSiteSettings_salonId_key" ON "SalonSiteSettings"("salonId");

-- CreateIndex
CREATE INDEX "SalonPage_salonId_status_idx" ON "SalonPage"("salonId", "status");

-- CreateIndex
CREATE INDEX "SalonPage_salonId_type_idx" ON "SalonPage"("salonId", "type");

-- CreateIndex
CREATE INDEX "SalonPage_salonId_publishedAt_idx" ON "SalonPage"("salonId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalonPage_salonId_slug_key" ON "SalonPage"("salonId", "slug");

-- CreateIndex
CREATE INDEX "SalonPageSection_pageId_sortOrder_idx" ON "SalonPageSection"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "SalonPageSection_pageId_isEnabled_idx" ON "SalonPageSection"("pageId", "isEnabled");

-- CreateIndex
CREATE INDEX "SalonPageSection_pageId_type_idx" ON "SalonPageSection"("pageId", "type");

-- CreateIndex
CREATE INDEX "SalonMedia_salonId_purpose_isActive_sortOrder_idx" ON "SalonMedia"("salonId", "purpose", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SalonMedia_salonId_category_idx" ON "SalonMedia"("salonId", "category");

-- CreateIndex
CREATE INDEX "SalonLink_salonId_type_idx" ON "SalonLink"("salonId", "type");

-- CreateIndex
CREATE INDEX "SalonLink_salonId_isPrimary_idx" ON "SalonLink"("salonId", "isPrimary");

-- CreateIndex
CREATE INDEX "SalonLink_salonId_isActive_idx" ON "SalonLink"("salonId", "isActive");

-- CreateIndex
CREATE INDEX "SalonAddress_salonId_idx" ON "SalonAddress"("salonId");

-- CreateIndex
CREATE INDEX "SalonAddress_salonId_isPrimary_idx" ON "SalonAddress"("salonId", "isPrimary");

-- CreateIndex
CREATE INDEX "SalonAddress_province_idx" ON "SalonAddress"("province");

-- CreateIndex
CREATE INDEX "SalonAddress_city_idx" ON "SalonAddress"("city");

-- CreateIndex
CREATE INDEX "SalonSlugHistory_salonId_createdAt_idx" ON "SalonSlugHistory"("salonId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalonSlugHistory_oldSlug_key" ON "SalonSlugHistory"("oldSlug");

-- CreateIndex
CREATE INDEX "SalonPageSlugHistory_pageId_createdAt_idx" ON "SalonPageSlugHistory"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "SalonPageSlugHistory_oldSlug_idx" ON "SalonPageSlugHistory"("oldSlug");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonCustomerProfile" ADD CONSTRAINT "SalonCustomerProfile_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonCustomerProfile" ADD CONSTRAINT "SalonCustomerProfile_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserService" ADD CONSTRAINT "UserService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserService" ADD CONSTRAINT "UserService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "SalonCustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_canceledByUserId_fkey" FOREIGN KEY ("canceledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonCommissionPolicy" ADD CONSTRAINT "SalonCommissionPolicy_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayment" ADD CONSTRAINT "CommissionPayment_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "BookingCommission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonSiteSettings" ADD CONSTRAINT "SalonSiteSettings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonPage" ADD CONSTRAINT "SalonPage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonPageSection" ADD CONSTRAINT "SalonPageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SalonPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonMedia" ADD CONSTRAINT "SalonMedia_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonLink" ADD CONSTRAINT "SalonLink_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonAddress" ADD CONSTRAINT "SalonAddress_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonSlugHistory" ADD CONSTRAINT "SalonSlugHistory_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonPageSlugHistory" ADD CONSTRAINT "SalonPageSlugHistory_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SalonPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
