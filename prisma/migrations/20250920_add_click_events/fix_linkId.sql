SET search_path = "public";
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "linkId" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
