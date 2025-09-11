-- Normalize existing string values to enum-compatible UPPERCASE
UPDATE "Commission" SET "status" = 'APPROVED'   WHERE "status" IN ('approved', 'Approved');
UPDATE "Commission" SET "status" = 'PENDING'    WHERE "status" IN ('pending', 'Pending');
UPDATE "Commission" SET "status" = 'PAID'       WHERE "status" IN ('paid', 'Paid');
UPDATE "Commission" SET "status" = 'UNVERIFIED' WHERE "status" IN ('unverified', 'Unverified');

-- Cast the column to the enum type and set default
ALTER TABLE "Commission"
  ALTER COLUMN "status" TYPE "CommissionStatus" USING ("status"::"CommissionStatus"),
  ALTER COLUMN "status" SET DEFAULT 'UNVERIFIED';
