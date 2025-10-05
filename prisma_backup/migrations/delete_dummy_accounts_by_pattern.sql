DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1) Delete from ALL child tables that FK-reference public."User"(id),
  --    but only for users whose emails match dummy patterns.
  FOR r IN
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema    = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name     = 'User'
      AND ccu.column_name    = 'id'
      AND tc.table_schema    = 'public'
  LOOP
    EXECUTE format(
      'DELETE FROM %I.%I WHERE %I IN (
         SELECT id FROM "User"
         WHERE email LIKE ''%%@example.test''
            OR email LIKE ''%%@example.com''
            OR email LIKE ''ref-%%''
            OR email LIKE ''alert%%''
       )',
      r.table_schema, r.table_name, r.column_name
    );
  END LOOP;

  -- 2) Delete the dummy users themselves
  DELETE FROM "User"
  WHERE email LIKE '%@example.test'
     OR email LIKE '%@example.com'
     OR email LIKE 'ref-%'
     OR email LIKE 'alert%';
END $$ LANGUAGE plpgsql;
