SELECT c.id, c.amount, c.status, c."merchantRuleId", m."merchantName"
FROM "Commission" c
LEFT JOIN "MerchantRule" m ON c."merchantRuleId" = m.id
WHERE c.id IN (
  'cmfamwqmg0003oim4yak9o16y', -- OEDRO commission
  'cmfamtezj0000oim41yjepcih'  -- iolo commission
);
