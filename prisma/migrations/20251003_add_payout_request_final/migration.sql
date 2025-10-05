-- AlterEnum
BEGIN;
CREATE TYPE "public"."PayoutProvider_new" AS ENUM ('PAYPAL', 'PAYONEER');
ALTER TABLE "public"."PayoutRequest" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "public"."Payout" ALTER COLUMN "provider" TYPE "public"."PayoutProvider_new" USING ("provider"::text::"public"."PayoutProvider_new");
ALTER TABLE "public"."PayoutAccount" ALTER COLUMN "provider" TYPE "public"."PayoutProvider_new" USING ("provider"::text::"public"."PayoutProvider_new");
ALTER TYPE "public"."PayoutProvider" RENAME TO "PayoutProvider_old";
ALTER TYPE "public"."PayoutProvider_new" RENAME TO "PayoutProvider";
DROP TYPE "public"."PayoutProvider_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."PayoutRequest" DROP CONSTRAINT "PayoutRequest_userId_fkey";

-- DropIndex
DROP INDEX "public"."merchant_domain_idx";

-- DropIndex
DROP INDEX "public"."merchant_market_active_idx";

-- DropIndex
DROP INDEX "public"."MerchantRule_merchantName_market_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "defaultBankAccountNumber",
DROP COLUMN "defaultBankName",
DROP COLUMN "defaultGcashNumber",
DROP COLUMN "defaultPayoutMethod";

-- AlterTable
ALTER TABLE "public"."PinCredential" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."UserFlag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."PayoutRequest";

-- DropEnum
DROP TYPE "public"."PayoutMethod";

