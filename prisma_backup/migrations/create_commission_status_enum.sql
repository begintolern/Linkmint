-- 1) Create the enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'CommissionStatus'
  ) THEN
    CREATE TYPE "CommissionStatus" AS ENUM ('UNVERIFIED','PENDING','APPROVED','PAID');
  END IF;
END $$ LANGUAGE plpgsql;

-- 2) Ensure the column exists and convert it to the enum with safe mapping
DO $$
DECLARE
  col_is_enum BOOLEAN;
BEGIN
  SELECT (data_type = 'USER-DEFINED' AND udt_name = 'CommissionStatus')
  INTO col_is_enum
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Commission'
    AND column_name = 'status';

  IF NOT col_is_enum THEN
    ALTER TABLE "Commission"
    ALTER COLUMN "status" TYPE "CommissionStatus"
    USING (
      CASE
        WHEN lower("status") = 'approved'   THEN 'APPROVED'::"CommissionStatus"
        WHEN lower("status") = 'pending'    THEN 'PENDING'::"CommissionStatus"
        WHEN lower("status") = 'paid'       THEN 'PAID'::"CommissionStatus"
        WHEN lower("status") = 'unverified' THEN 'UNVERIFIED'::"CommissionStatus"
        WHEN "status" IN ('APPROVED','PENDING','PAID','UNVERIFIED') THEN "status"::"CommissionStatus"
        ELSE 'UNVERIFIED'::"CommissionStatus"
      END
    );
  END IF;

  -- 3) Set default
  ALTER TABLE "Commission"
    ALTER COLUMN "status" SET DEFAULT 'UNVERIFIED'::"CommissionStatus";
END $$ LANGUAGE plpgsql;
