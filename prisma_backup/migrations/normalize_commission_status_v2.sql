DO $$
DECLARE
  is_enum boolean;
BEGIN
  -- Is "status" already the CommissionStatus enum?
  SELECT (data_type = 'USER-DEFINED' AND udt_name = 'CommissionStatus')
  INTO is_enum
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Commission'
    AND column_name = 'status';

  IF NOT is_enum THEN
    -- Column is TEXT (or something else). Normalize and cast in one go.
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
  ELSE
    -- Column is already enum. Ensure any residual values are valid (should be already).
    -- No-op updates guarded with explicit casts.
    UPDATE "Commission" SET "status" = 'APPROVED'::"CommissionStatus"   WHERE "status"::text ILIKE 'approved';
    UPDATE "Commission" SET "status" = 'PENDING'::"CommissionStatus"    WHERE "status"::text ILIKE 'pending';
    UPDATE "Commission" SET "status" = 'PAID'::"CommissionStatus"       WHERE "status"::text ILIKE 'paid';
    UPDATE "Commission" SET "status" = 'UNVERIFIED'::"CommissionStatus" WHERE "status"::text ILIKE 'unverified';
  END IF;

  -- Ensure default is set
  ALTER TABLE "Commission"
    ALTER COLUMN "status" SET DEFAULT 'UNVERIFIED'::"CommissionStatus";
END $$ LANGUAGE plpgsql;
