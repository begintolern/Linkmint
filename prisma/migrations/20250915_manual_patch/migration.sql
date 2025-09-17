/* manual patch: add missing columns safely */

-- Add MerchantRule.status if missing
ALTER TABLE "MerchantRule"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Add User.deletedAt if missing
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
