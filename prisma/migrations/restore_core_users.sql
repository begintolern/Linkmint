-- Recreate core users; skips if the email already exists
INSERT INTO "User" ("email","role","emailVerifiedAt","createdAt","updatedAt")
VALUES
  ('epo78741@gmail.com','ADMIN', NOW(), NOW(), NOW()),
  ('epo78741@yahoo.com','ADMIN', NOW(), NOW(), NOW()),
  ('ertorig3@gmail.com','user', NOW(), NOW(), NOW()),
  ('fluterby_25@yahoo.com','user', NOW(), NOW(), NOW())
   
ON CONFLICT (email) DO NOTHING;
