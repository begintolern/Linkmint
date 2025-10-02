-- Add Commission.updatedAt with a default, then require it
ALTER TABLE "Commission"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add EventLog.severity with default
ALTER TABLE "EventLog"
  ADD COLUMN IF NOT EXISTS "severity" INTEGER NOT NULL DEFAULT 1;
