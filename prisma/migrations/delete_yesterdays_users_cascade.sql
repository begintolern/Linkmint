DO $$
DECLARE
  r RECORD;
BEGIN
  -- Delete from ALL child tables that FK-reference public."User"(id)
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
      'DELETE FROM %I.%I WHERE %I IN (SELECT id FROM "User" WHERE "createdAt"::date = CURRENT_DATE - INTERVAL ''1 day'')',
      r.table_schema, r.table_name, r.column_name
    );
  END LOOP;

  -- Finally delete the users created yesterday
  DELETE FROM "User"
  WHERE "createdAt"::date = CURRENT_DATE - INTERVAL '1 day';
END $$ LANGUAGE plpgsql;
