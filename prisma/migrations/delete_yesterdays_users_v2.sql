-- 1) Delete commissions for users created yesterday
DELETE FROM "Commission" c
WHERE EXISTS (
  SELECT 1
  FROM "User" u
  WHERE u.id = c."userId"
    AND u."createdAt"::date = CURRENT_DATE - INTERVAL '1 day'
);

-- 2) Delete those users
DELETE FROM "User" u
WHERE u."createdAt"::date = CURRENT_DATE - INTERVAL '1 day';
