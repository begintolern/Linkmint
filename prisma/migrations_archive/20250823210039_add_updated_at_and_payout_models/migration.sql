/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the `eventLogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referralBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referralGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `systemSetting` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PayoutProvider" AS ENUM ('PAYPAL', 'PAYONEER');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_referralGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."eventLogs" DROP CONSTRAINT "eventLogs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."referralBatch" DROP CONSTRAINT "referralBatch_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."referralGroup" DROP CONSTRAINT "referralGroup_referrerId_fkey";

-- DropIndex
DROP INDEX "public"."VerificationToken_userId_key";

-- AlterTable
ALTER TABLE "public"."Payout" ADD COLUMN     "externalPayoutId" TEXT,
ADD COLUMN     "feeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "netCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutAccountId" TEXT,
ADD COLUMN     "paypalBatchId" VARCHAR(191),
ADD COLUMN     "provider" "public"."PayoutProvider",
ADD COLUMN     "receiverEmail" VARCHAR(191),
ADD COLUMN     "statusEnum" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionId" VARCHAR(191);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."VerificationToken" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "public"."eventLogs";

-- DropTable
DROP TABLE "public"."referralBatch";

-- DropTable
DROP TABLE "public"."referralGroup";

-- DropTable
DROP TABLE "public"."systemSetting";

-- CreateTable
CREATE TABLE "public"."ReferralGroup" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralBatch" (
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
CREATE TABLE "public"."EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayoutAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."PayoutProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."PayoutLog" (
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

-- CreateIndex
CREATE INDEX "EventLog_userId_createdAt_idx" ON "public"."EventLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutAccount_userId_isDefault_idx" ON "public"."PayoutAccount"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAccount_userId_provider_externalId_key" ON "public"."PayoutAccount"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "PayoutLog_userId_createdAt_idx" ON "public"."PayoutLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_userId_status_idx" ON "public"."Payout"("userId", "status");

-- CreateIndex
CREATE INDEX "Payout_userId_statusEnum_idx" ON "public"."Payout"("userId", "statusEnum");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_referralGroupId_fkey" FOREIGN KEY ("referralGroupId") REFERENCES "public"."ReferralGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralGroup" ADD CONSTRAINT "ReferralGroup_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBatch" ADD CONSTRAINT "ReferralBatch_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayoutAccount" ADD CONSTRAINT "PayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayoutLog" ADD CONSTRAINT "PayoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
