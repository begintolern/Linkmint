-- Upsert admin user for your email, and undelete if it already exists
WITH row AS (
  SELECT
    ('usr_' || substr(md5(random()::text), 1, 20)) AS id,
    'epo78741@gmail.com'::text AS email
)
INSERT INTO "User" (
  "id","email","role","emailVerifiedAt","createdAt","updatedAt","trustScore","deletedAt"
)
SELECT
  r.id, r.email, 'ADMIN', NOW(), NOW(), NOW(), 0, NULL
FROM row r
ON CONFLICT ("email") DO UPDATE
SET
  "role" = 'ADMIN',
  "emailVerifiedAt" = NOW(),
  "updatedAt" = NOW(),
  "deletedAt" = NULL;
