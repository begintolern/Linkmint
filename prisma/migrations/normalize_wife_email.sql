DO $$
BEGIN
  -- If the correct row already exists, delete any typo rows
  IF EXISTS (SELECT 1 FROM "User" WHERE email = 'fulterby_25@yahoo.com') THEN
    DELETE FROM "User" WHERE email IN ('fluterby_yahoo.com', 'fluterby_yahoo,.com');
  ELSE
    -- Otherwise, fix the typo -> correct email
    UPDATE "User"
    SET "email" = 'fulterby_25@yahoo.com', "updatedAt" = NOW()
    WHERE email IN ('fluterby_yahoo.com', 'fluterby_yahoo,.com');
  END IF;
END $$ LANGUAGE plpgsql;
