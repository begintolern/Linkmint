-- AlterTable
ALTER TABLE "public"."MerchantRule" ALTER COLUMN "network" DROP NOT NULL,
ALTER COLUMN "domainPattern" DROP NOT NULL;
