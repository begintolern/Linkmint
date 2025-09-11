-- 1) Add the column if it doesn't exist
ALTER TABLE "Commission"
  ADD COLUMN IF NOT EXISTS "merchantRuleId" TEXT;

-- 2) Add the FK only if it's missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Commission_merchantRuleId_fkey'
      AND table_name = 'Commission'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "Commission"
      ADD CONSTRAINT "Commission_merchantRuleId_fkey"
      FOREIGN KEY ("merchantRuleId") REFERENCES "MerchantRule"("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$ LANGUAGE plpgsql;

-- 3) Add an index for lookups
CREATE INDEX IF NOT EXISTS "Commission_merchantRuleId_idx"
  ON "Commission"("merchantRuleId");
