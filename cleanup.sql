DELETE FROM "VerificationToken"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email IN (
    'test7@example.com',
    'test6@example.com',
    'test5@example.com',
    'test4@example.com',
    'test3@example.com',
    'test2@example.com',
    'test4321@example.com',
    'test1234@example.com',
    'epo78741@yahoo.com'
  )
);

DELETE FROM "User"
WHERE email IN (
  'test7@example.com',
  'test6@example.com',
  'test5@example.com',
  'test4@example.com',
  'test3@example.com',
  'test2@example.com',
  'test4321@example.com',
  'test1234@example.com',
  'epo78741@yahoo.com'
);
