SET search_path = "public";
ALTER TABLE "ClickEvent" ALTER COLUMN "merchantId" DROP NOT NULL;
