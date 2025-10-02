-- CreateIndex
CREATE INDEX "merchant_domain_idx" ON "public"."MerchantRule"("domainPattern");

-- CreateIndex
CREATE INDEX "merchant_market_active_idx" ON "public"."MerchantRule"("market", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRule_merchantName_market_key" ON "public"."MerchantRule"("merchantName", "market");

