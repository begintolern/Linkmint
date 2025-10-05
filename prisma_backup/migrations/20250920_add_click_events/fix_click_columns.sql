SET search_path = "public";
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "url" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "referer" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "ip" VARCHAR(45); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "userAgent" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClickEvent" ADD COLUMN "meta" JSONB; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
