-- Create and target a dedicated shadow schema
CREATE SCHEMA IF NOT EXISTS "shadow_gpt_20250919";
SET search_path = "shadow_gpt_20250919";

-- Safely create enums if they don't exist (shadow replays often hit duplicates)
DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."PayoutProvider" AS ENUM ('PAYPAL','PAYONEER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."PayoutStatus" AS ENUM ('PENDING','PROCESSING','PAID','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."CommissionStatus" AS ENUM ('UNVERIFIED','PENDING','APPROVED','PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."CommissionType" AS ENUM ('referral_purchase','override_bonus','payout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."AffiliateNetwork" AS ENUM ('AMAZON','SHAREASALE','CJ','IMPACT','RAKUTEN','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."ImportMethod" AS ENUM ('API','CSV','MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "shadow_gpt_20250919"."CommissionCalc" AS ENUM ('PERCENT','FIXED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralGroupId" TEXT,
    "referredById" TEXT,
    "verifyToken" TEXT,
    "verifyTokenExpiry" TIMESTAMP(3),
    "trustScore" INTEGER DEFAULT 0,
    "referralBadge" TEXT,
    "referralCode" TEXT,
    "role" TEXT DEFAULT 'user',
    "emailVerifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "ageConfirmedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "dob" TIMESTAMP(3),
    "tosAcceptedAt" TIMESTAMP(3),
    "tosAcceptedIp" VARCHAR(64),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."ReferralGroup" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."ReferralBatch" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "inviteeIds" TEXT[],
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."PayoutAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "shadow_gpt_20250919"."PayoutProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "externalPayoutId" TEXT,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "netCents" INTEGER NOT NULL DEFAULT 0,
    "payoutAccountId" TEXT,
    "paypalBatchId" VARCHAR(191),
    "provider" "shadow_gpt_20250919"."PayoutProvider",
    "receiverEmail" VARCHAR(191),
    "statusEnum" "shadow_gpt_20250919"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" VARCHAR(191),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."FloatLog" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."PendingUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "verifyToken" TEXT NOT NULL,
    "verifyTokenExpiry" TIMESTAMP(3) NOT NULL,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."Commission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "shadow_gpt_20250919"."CommissionType" NOT NULL,
    "paidOut" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merchantRuleId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "shadow_gpt_20250919"."CommissionStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."OverrideCommission" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sourceCommissionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'Referral bonus override',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverrideCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."NetworkAccount" (
    "id" TEXT NOT NULL,
    "network" "shadow_gpt_20250919"."AffiliateNetwork" NOT NULL,
    "accountId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."MerchantRule" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "merchantName" TEXT NOT NULL,
    "network" TEXT,
    "domainPattern" TEXT,
    "paramKey" TEXT,
    "paramValue" TEXT,
    "linkTemplate" TEXT,
    "allowedSources" JSONB,
    "disallowed" JSONB,
    "cookieWindowDays" INTEGER,
    "payoutDelayDays" INTEGER,
    "commissionType" "shadow_gpt_20250919"."CommissionCalc" NOT NULL DEFAULT 'PERCENT',
    "commissionRate" DECIMAL(65,30),
    "calc" TEXT,
    "rate" DOUBLE PRECISION,
    "notes" TEXT,
    "importMethod" "shadow_gpt_20250919"."ImportMethod" NOT NULL DEFAULT 'MANUAL',
    "apiBaseUrl" TEXT,
    "apiAuthType" TEXT,
    "apiKeyRef" TEXT,
    "lastImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "allowedRegions" TEXT[],
    "inactiveReason" TEXT,

    CONSTRAINT "MerchantRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."VerificationToken" (
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."PayoutLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "receiverEmail" TEXT,
    "amount" DOUBLE PRECISION,
    "paypalBatchId" TEXT,
    "transactionId" TEXT,
    "note" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."PinCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "pinHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."SmartLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantRuleId" TEXT,
    "merchantName" TEXT NOT NULL,
    "merchantDomain" TEXT,
    "originalUrl" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_gpt_20250919"."AdvertiserApplication" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commission" TEXT,
    "cookieWindow" INTEGER,
    "notes" TEXT,

    CONSTRAINT "AdvertiserApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "shadow_gpt_20250919"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verifyToken_key" ON "shadow_gpt_20250919"."User"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "shadow_gpt_20250919"."User"("referralCode");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "shadow_gpt_20250919"."User"("deletedAt");

-- CreateIndex
CREATE INDEX "EventLog_userId_createdAt_idx" ON "shadow_gpt_20250919"."EventLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutAccount_userId_isDefault_idx" ON "shadow_gpt_20250919"."PayoutAccount"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAccount_userId_provider_externalId_key" ON "shadow_gpt_20250919"."PayoutAccount"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "Payout_userId_status_idx" ON "shadow_gpt_20250919"."Payout"("userId", "status");

-- CreateIndex
CREATE INDEX "Payout_userId_statusEnum_idx" ON "shadow_gpt_20250919"."Payout"("userId", "statusEnum");

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_email_key" ON "shadow_gpt_20250919"."PendingUser"("email");

-- CreateIndex
CREATE INDEX "Commission_merchantRuleId_idx" ON "shadow_gpt_20250919"."Commission"("merchantRuleId");

-- CreateIndex
CREATE INDEX "Commission_userId_status_idx" ON "shadow_gpt_20250919"."Commission"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAccount_network_accountId_key" ON "shadow_gpt_20250919"."NetworkAccount"("network", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "shadow_gpt_20250919"."VerificationToken"("token");

-- CreateIndex
CREATE INDEX "PayoutLog_userId_createdAt_idx" ON "shadow_gpt_20250919"."PayoutLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "shadow_gpt_20250919"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "shadow_gpt_20250919"."Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PinCredential_userId_deviceId_key" ON "shadow_gpt_20250919"."PinCredential"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."User" ADD CONSTRAINT "User_referralGroupId_fkey" FOREIGN KEY ("referralGroupId") REFERENCES "shadow_gpt_20250919"."ReferralGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."ReferralGroup" ADD CONSTRAINT "ReferralGroup_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."ReferralBatch" ADD CONSTRAINT "ReferralBatch_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."PayoutAccount" ADD CONSTRAINT "PayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."Commission" ADD CONSTRAINT "Commission_merchantRuleId_fkey" FOREIGN KEY ("merchantRuleId") REFERENCES "shadow_gpt_20250919"."MerchantRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."OverrideCommission" ADD CONSTRAINT "OverrideCommission_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."OverrideCommission" ADD CONSTRAINT "OverrideCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."PayoutLog" ADD CONSTRAINT "PayoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."PinCredential" ADD CONSTRAINT "PinCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."SmartLink" ADD CONSTRAINT "SmartLink_merchantRuleId_fkey" FOREIGN KEY ("merchantRuleId") REFERENCES "shadow_gpt_20250919"."MerchantRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_gpt_20250919"."SmartLink" ADD CONSTRAINT "SmartLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shadow_gpt_20250919"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
