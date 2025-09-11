-- Create two admin users with explicit IDs (text), safe if run again
WITH rows AS (
  SELECT
    ('usr_' || substr(md5(random()::text), 1, 20)) AS id,
    email,
    role
  FROM (VALUES
    ('epo78741@gmail.com', 'ADMIN'),
    ('fluterby_25@yahoo.com', 'ADMIN')           -- ← replace this
  ) v(email, role)
)
INSERT INTO "User" (
  "id", "email", "role", "emailVerifiedAt", "createdAt", "updatedAt", "trustScore"
)
SELECT
  r.id,
  r.email,
  r.role,
  NOW(), NOW(), NOW(),
  0
FROM rows r
ON CONFLICT ("email") DO NOTHING;
