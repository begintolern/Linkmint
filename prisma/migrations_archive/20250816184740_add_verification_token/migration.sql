/*
  Warnings:

  - The `detail` column on the `eventLogs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."eventLogs" DROP COLUMN "detail",
ADD COLUMN     "detail" JSONB;

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE INDEX "verification_token_identifier_idx" ON "public"."VerificationToken"("identifier");
