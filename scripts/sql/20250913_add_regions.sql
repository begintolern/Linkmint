-- Add region tracking + inactivation reason to MerchantRule (safe if rerun)
ALTER TABLE "MerchantRule" ADD COLUMN IF NOT EXISTS "allowedRegions" TEXT[];
ALTER TABLE "MerchantRule" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT;
