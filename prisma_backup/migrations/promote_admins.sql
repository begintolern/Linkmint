-- Promote selected users back to admin

UPDATE "User" 
SET "role" = 'admin'
WHERE email IN (
  'epo78741@yahoo.com',
  'ertorig3@gmail.com',
  'epo78741@yahoo.com',
 );
