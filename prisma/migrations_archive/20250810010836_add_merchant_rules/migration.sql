/*
  Warnings:

  - You are about to drop the `payouts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."CommissionType" AS ENUM ('referral_purchase', 'override_bonus', 'payout');

-- CreateEnum
CREATE TYPE "public"."AffiliateNetwork" AS ENUM ('AMAZON', 'SHAREASALE', 'CJ', 'IMPACT', 'RAKUTEN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ImportMethod" AS ENUM ('API', 'CSV', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."CommissionCalc" AS ENUM ('PERCENT', 'FIXED');

-- DropForeignKey
ALTER TABLE "public"."payouts" DROP CONSTRAINT "payouts_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" TEXT DEFAULT 'user';

-- AlterTable
ALTER TABLE "public"."referralGroup" ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."payouts";

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."CommissionType" NOT NULL,
    "status" TEXT NOT NULL,
    "paidOut" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OverrideCommission" (
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
CREATE TABLE "public"."systemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "systemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."NetworkAccount" (
    "id" TEXT NOT NULL,
    "network" "public"."AffiliateNetwork" NOT NULL,
    "accountId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MerchantRule" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "merchantName" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "domainPattern" TEXT NOT NULL,
    "paramKey" TEXT,
    "paramValue" TEXT,
    "linkTemplate" TEXT,
    "allowedSources" JSONB,
    "disallowed" JSONB,
    "cookieWindowDays" INTEGER,
    "payoutDelayDays" INTEGER,
    "commissionType" "public"."CommissionCalc" NOT NULL DEFAULT 'PERCENT',
    "commissionRate" DECIMAL(65,30),
    "calc" TEXT,
    "rate" DOUBLE PRECISION,
    "notes" TEXT,
    "importMethod" "public"."ImportMethod" NOT NULL DEFAULT 'MANUAL',
    "apiBaseUrl" TEXT,
    "apiAuthType" TEXT,
    "apiKeyRef" TEXT,
    "lastImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAccount_network_accountId_key" ON "public"."NetworkAccount"("network", "accountId");

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OverrideCommission" ADD CONSTRAINT "OverrideCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OverrideCommission" ADD CONSTRAINT "OverrideCommission_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
