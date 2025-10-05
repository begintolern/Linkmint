-- Count dummy/test accounts

-- All users with @example.test emails
SELECT COUNT(*) AS cnt_example_test
FROM "User"
WHERE email LIKE '%@example.test';

-- All users starting with "ref-" (referral seed accounts)
SELECT COUNT(*) AS cnt_ref
FROM "User"
WHERE email LIKE 'ref-%';

-- All users starting with "alert" (alert seed accounts)
SELECT COUNT(*) AS cnt_alert
FROM "User"
WHERE email LIKE 'alert%';

-- Show a sample list (first 20 dummy users)
SELECT id, email, "createdAt"
FROM "User"
WHERE email LIKE '%@example.test'
   OR email LIKE 'ref-%'
   OR email LIKE 'alert%'
ORDER BY "createdAt" ASC
LIMIT 20;
