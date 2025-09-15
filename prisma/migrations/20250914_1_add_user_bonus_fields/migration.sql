-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bonusCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonusEligibleUntil" TIMESTAMP(3),
ADD COLUMN     "bonusTier" INTEGER NOT NULL DEFAULT 0;

