-- target the shadow schema and make the column adds idempotent
SET search_path = "shadow_gpt_20250919";

ALTER TABLE "shadow_gpt_20250919"."User"
  ADD COLUMN IF NOT EXISTS "bonusCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bonusEligibleUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "bonusTier" INTEGER NOT NULL DEFAULT 0;
