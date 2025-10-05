-- Collect all users created yesterday (DB date)
WITH users_to_delete AS (
  SELECT id
  FROM "User"
  WHERE "createdAt"::date = CURRENT_DATE - INTERVAL '1 day'
)

-- 1) Remove their commissions first (avoid FK issues)
DELETE FROM "Commission"
WHERE "userId" IN (SELECT id FROM users_to_delete);

-- 2) Remove the users
DELETE FROM "User"
WHERE id IN (SELECT id FROM users_to_delete);
