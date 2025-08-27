DELETE FROM "VerificationToken" WHERE "userId" NOT IN (SELECT id FROM "User");

DELETE FROM "User" WHERE email IN (
  'epo78741@yahoo.com',
  'test1234@example.com',
  'test4321@example.com',
  'test2@example.com',
  'test3@example.com',
  'test4@example.com',
  'test5@example.com',
  'test6@example.com',
  'test7@example.com'
);
