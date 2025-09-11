-- Add a foreign key from Commission.merchantRuleId → MerchantRule.id
ALTER TABLE "Commission"
  ADD CONSTRAINT "Commission_merchantRuleId_fkey"
  FOREIGN KEY ("merchantRuleId")
  REFERENCES "MerchantRule"("id")
  ON UPDATE CASCADE
  ON DELETE SET NULL;
