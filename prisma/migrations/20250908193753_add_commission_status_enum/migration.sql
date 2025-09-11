/*
  Warnings:

  - The `status` column on the `Commission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Commission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'APPROVED', 'PAID');

-- AlterTable
ALTER TABLE "public"."Commission" ADD COLUMN     "merchantRuleId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."CommissionStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- CreateIndex
CREATE INDEX "Commission_merchantRuleId_idx" ON "public"."Commission"("merchantRuleId");

-- CreateIndex
CREATE INDEX "Commission_userId_status_idx" ON "public"."Commission"("userId", "status");

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_merchantRuleId_fkey" FOREIGN KEY ("merchantRuleId") REFERENCES "public"."MerchantRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
