UPDATE public."User"
SET "disabled" = false,
    "deletedAt" = NULL,
    "createdAt" = TIMESTAMPTZ '2024-01-01 00:00:00+00',
    "defaultGcashNumber" = COALESCE(NULLIF("defaultGcashNumber", ''), '09171234567');

INSERT INTO public."Commission" ("id","userId","amount","type","paidOut","status","createdAt","updatedAt")
SELECT
  'dev_comm_' || floor(extract(epoch from now())*1000)::bigint::text || '_' || left(u.id,6),
  u.id,
  100.00,
  'referral_purchase',
  false,
  'APPROVED',
  now(),
  now()
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public."Commission" c
  WHERE c."userId" = u.id AND c."status"='APPROVED' AND c."paidOut"=false
);
