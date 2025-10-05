-- ClickEvent manual migration (targets the real DB schema = public)
SET search_path = "public";

-- 1) Table
CREATE TABLE IF NOT EXISTS "ClickEvent" (
  "id"         TEXT        NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"     TEXT,
  "merchantId" TEXT,
  "linkId"     TEXT,
  "source"     TEXT        NOT NULL,
  "url"        TEXT,
  "referer"    TEXT,
  "ip"         VARCHAR(45),
  "userAgent"  TEXT,
  "meta"       JSONB,

  CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id"),

  -- FKs match the Prisma relations (nullable, cascade on update, set null on delete)
  CONSTRAINT "ClickEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "ClickEvent_merchantId_fkey"
    FOREIGN KEY ("merchantId") REFERENCES "MerchantRule"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2) Helpful indexes
CREATE INDEX IF NOT EXISTS "ClickEvent_userId_createdAt_idx"
  ON "ClickEvent"("userId","createdAt");

CREATE INDEX IF NOT EXISTS "ClickEvent_merchantId_createdAt_idx"
  ON "ClickEvent"("merchantId","createdAt");

CREATE INDEX IF NOT EXISTS "ClickEvent_source_createdAt_idx"
  ON "ClickEvent"("source","createdAt");
