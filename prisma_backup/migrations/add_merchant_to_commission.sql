-- AlterTable
ALTER TABLE "public"."Commission" ADD COLUMN     "merchantRuleId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Commission_merchantRuleId_idx" ON "public"."Commission"("merchantRuleId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_merchantRuleId_fkey" FOREIGN KEY ("merchantRuleId") REFERENCES "public"."MerchantRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

