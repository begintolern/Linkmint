-- CreateEnum
CREATE TYPE "public"."PayoutMethod" AS ENUM ('GCASH', 'BANK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PayoutProvider" ADD VALUE 'MANUAL';
ALTER TYPE "public"."PayoutProvider" ADD VALUE 'XENDIT';
ALTER TYPE "public"."PayoutProvider" ADD VALUE 'PAYMONGO';

-- AlterTable
ALTER TABLE "public"."PinCredential" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "defaultBankAccountNumber" VARCHAR(40),
ADD COLUMN     "defaultBankName" VARCHAR(80),
ADD COLUMN     "defaultGcashNumber" VARCHAR(20),
ADD COLUMN     "defaultPayoutMethod" "public"."PayoutMethod";

-- AlterTable
ALTER TABLE "public"."UserFlag" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPhp" INTEGER NOT NULL,
    "method" "public"."PayoutMethod" NOT NULL,
    "gcashNumber" VARCHAR(20),
    "bankName" VARCHAR(80),
    "bankAccountNumber" VARCHAR(40),
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "public"."PayoutProvider" NOT NULL DEFAULT 'MANUAL',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processorNote" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_status_requestedAt_idx" ON "public"."PayoutRequest"("userId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_requestedAt_idx" ON "public"."PayoutRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "merchant_domain_idx" ON "public"."MerchantRule"("domainPattern");

-- CreateIndex
CREATE INDEX "merchant_market_active_idx" ON "public"."MerchantRule"("market", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRule_merchantName_market_key" ON "public"."MerchantRule"("merchantName", "market");

-- AddForeignKey
ALTER TABLE "public"."PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

