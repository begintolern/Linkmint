SELECT c.id, c.amount, c.status, c."createdAt", m."merchantName"
FROM "Commission" c
JOIN "User" u ON u.id = c."userId"
LEFT JOIN "MerchantRule" m ON m.id = c."merchantRuleId"
WHERE u.email = 'wife@email.com'   -- 🔹 replace with her actual email
ORDER BY c."createdAt" DESC;
